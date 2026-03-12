<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Camera, Loader2, Scissors, Trash2 } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import { apiRequest } from '../lib/api'
import { resolveUserAvatarUrl } from '../lib/media'
import ImageCropModal from './ImageCropModal.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  user: { type: Object, required: true },
})

const emit = defineEmits(['close', 'save'])
const { token } = useAuth()
const handlePattern = /^[a-z0-9._]{3,30}$/
let handleTimer = null

const draftName = ref('')
const draftHandle = ref('')
const draftEmail = ref('')
const draftMobile = ref('')
const saving = ref(false)
const formError = ref('')

const handleStatus = ref('idle')
const handleMessage = ref('')

const fileInput = ref(null)
const clearProfilePhoto = ref(false)
const cropSourceUrl = ref('')
const croppedPhotoDataUrl = ref('')
const cropModalOpen = ref(false)

const normalizedHandle = computed(() =>
  String(draftHandle.value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/\s+/g, ''),
)
const currentHandle = computed(() => String(props.user?.loginName ?? '').trim())
const existingAvatarUrl = computed(() => resolveUserAvatarUrl(props.user?.profilePhoto))
const previewAvatarUrl = computed(() =>
  croppedPhotoDataUrl.value || (clearProfilePhoto.value ? '' : existingAvatarUrl.value),
)
const canSave = computed(
  () =>
    !saving.value &&
    String(draftName.value).trim().length > 0 &&
    normalizedHandle.value.length > 0 &&
    handleStatus.value !== 'taken' &&
    handleStatus.value !== 'checking' &&
    handleStatus.value !== 'invalid' &&
    handleStatus.value !== 'error',
)
const handleStatusClass = computed(() => {
  if (handleStatus.value === 'available') return 'text-emerald-600'
  if (handleStatus.value === 'taken') return 'text-red-600'
  if (handleStatus.value === 'invalid') return 'text-red-600'
  if (handleStatus.value === 'checking') return 'text-zinc-500'
  return 'text-zinc-500'
})
const initials = computed(() => {
  const parts = String(draftName.value).trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || 'U'
})

function resetDraft() {
  draftName.value = props.user?.fullName ?? props.user?.loginName ?? ''
  draftHandle.value = props.user?.loginName ?? ''
  draftEmail.value = props.user?.email ?? ''
  draftMobile.value = props.user?.mobileNumber ?? ''
  formError.value = ''
  handleStatus.value = 'idle'
  handleMessage.value = ''
  clearProfilePhoto.value = false
  croppedPhotoDataUrl.value = ''
  cropSourceUrl.value = ''
  cropModalOpen.value = false
  if (fileInput.value) fileInput.value.value = ''
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) resetDraft()
    else cropModalOpen.value = false
  },
)

watch(normalizedHandle, (value) => {
  if (!props.open) return
  if (handleTimer) clearTimeout(handleTimer)
  if (!value) {
    handleStatus.value = 'idle'
    handleMessage.value = 'Handle is required.'
    return
  }
  if (!handlePattern.test(value)) {
    handleStatus.value = 'invalid'
    handleMessage.value = 'Use 3-30 chars: lowercase letters, numbers, dot, underscore.'
    return
  }
  if (value === currentHandle.value) {
    handleStatus.value = 'idle'
    handleMessage.value = 'This is your current handle.'
    return
  }
  handleStatus.value = 'checking'
  handleMessage.value = 'Checking availability...'
  handleTimer = setTimeout(checkHandleAvailability, 380)
})

async function checkHandleAvailability() {
  try {
    const res = await apiRequest(
      `/api/users/check-login-name?loginName=${encodeURIComponent(normalizedHandle.value)}`,
      {
        headers: { Authorization: `Bearer ${token.value}` },
      },
    )
    handleStatus.value = res.available ? 'available' : 'taken'
    handleMessage.value = res.available
      ? 'Username is available.'
      : 'Username already taken.'
  } catch (err) {
    handleStatus.value = 'error'
    handleMessage.value = err?.message ?? 'Unable to validate handle right now.'
  }
}

function onHandleInput() {
  draftHandle.value = normalizedHandle.value
}

function onPickFile() {
  fileInput.value?.click()
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const isSupported = /^image\/(png|jpe?g|webp)$/i.test(file.type)
  if (!isSupported) {
    formError.value = 'Please upload a PNG, JPG, or WEBP image.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    formError.value = 'Image must be less than 5MB.'
    return
  }

  formError.value = ''
  clearProfilePhoto.value = false
  if (cropSourceUrl.value.startsWith('blob:')) URL.revokeObjectURL(cropSourceUrl.value)
  cropSourceUrl.value = URL.createObjectURL(file)
  cropModalOpen.value = true
}

function onCropConfirm(dataUrl) {
  croppedPhotoDataUrl.value = dataUrl
  clearProfilePhoto.value = false
  cropModalOpen.value = false
}

function onCropCancel() {
  cropModalOpen.value = false
}

function onRemovePhoto() {
  if (cropSourceUrl.value.startsWith('blob:')) URL.revokeObjectURL(cropSourceUrl.value)
  cropSourceUrl.value = ''
  croppedPhotoDataUrl.value = ''
  clearProfilePhoto.value = true
  cropModalOpen.value = false
  if (fileInput.value) fileInput.value.value = ''
}

async function onSave() {
  if (!canSave.value) return
  formError.value = ''
  saving.value = true
  try {
    const res = await apiRequest('/api/users/me/profile', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: JSON.stringify({
        fullName: String(draftName.value).trim(),
        loginName: normalizedHandle.value,
        email: String(draftEmail.value).trim(),
        mobileNumber: String(draftMobile.value).trim(),
        profilePhotoDataUrl: croppedPhotoDataUrl.value,
        clearProfilePhoto: clearProfilePhoto.value,
      }),
    })
    emit('save', res.user)
    emit('close')
  } catch (err) {
    formError.value = err?.message ?? 'Failed to update profile.'
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  if (handleTimer) clearTimeout(handleTimer)
  if (cropSourceUrl.value.startsWith('blob:')) URL.revokeObjectURL(cropSourceUrl.value)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.open"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/45 px-4 py-6"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/20">
          <div class="grid gap-0 md:grid-cols-[280px_1fr]">
            <div class="border-b border-zinc-200 bg-zinc-50 p-5 md:border-b-0 md:border-r">
              <h2 class="text-base font-semibold text-zinc-900">Profile photo</h2>
              <p class="mt-1 text-xs text-zinc-500">Upload and crop a square avatar.</p>

              <div class="mt-4 flex justify-center">
                <div
                  class="relative h-44 w-44 overflow-hidden rounded-3xl border border-zinc-200 bg-white"
                >
                  <img
                    v-if="previewAvatarUrl"
                    :src="previewAvatarUrl"
                    alt="Current profile avatar"
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center bg-zinc-900 text-2xl font-semibold text-white"
                  >
                    {{ initials }}
                  </div>
                </div>
              </div>

              <input
                ref="fileInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden"
                @change="onFileChange"
              />

              <button
                type="button"
                class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                @click="onPickFile"
              >
                <Camera class="h-4 w-4" />
                {{ croppedPhotoDataUrl || previewAvatarUrl ? 'Replace photo' : 'Upload photo' }}
              </button>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="!cropSourceUrl && !croppedPhotoDataUrl"
                  @click="cropModalOpen = true"
                >
                  <Scissors class="h-3.5 w-3.5" />
                  Crop
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                  @click="onRemovePhoto"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>

            <div class="p-5 md:p-6">
              <div class="mb-5">
                <h3 class="text-lg font-semibold text-zinc-900">Edit Profile</h3>
                <p class="text-sm text-zinc-500">Update your details and save changes instantly.</p>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block sm:col-span-2">
                  <span class="mb-1 block text-sm font-medium text-zinc-700">Name</span>
                  <input
                    v-model="draftName"
                    type="text"
                    class="h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    placeholder="Full name"
                  />
                </label>

                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-zinc-700">Handle</span>
                  <input
                    v-model="draftHandle"
                    @input="onHandleInput"
                    type="text"
                    class="h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    placeholder="@username"
                  />
                  <p class="mt-1 text-xs" :class="handleStatusClass">
                    {{ handleMessage || 'Used as your login handle.' }}
                  </p>
                </label>

                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-zinc-700">Mobile number</span>
                  <input
                    v-model="draftMobile"
                    type="text"
                    inputmode="numeric"
                    maxlength="10"
                    class="h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    placeholder="10-digit number"
                  />
                </label>

                <label class="block sm:col-span-2">
                  <span class="mb-1 block text-sm font-medium text-zinc-700">Email</span>
                  <input
                    v-model="draftEmail"
                    type="email"
                    class="h-11 w-full rounded-xl border border-zinc-300 px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                    placeholder="you@company.com"
                  />
                </label>
              </div>

              <div
                v-if="formError"
                class="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {{ formError }}
              </div>

              <div class="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                  :disabled="saving"
                  @click="emit('close')"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="!canSave"
                  @click="onSave"
                >
                  <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
                  <span>{{ saving ? 'Saving...' : 'Save changes' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <ImageCropModal
    :open="cropModalOpen"
    :image-src="cropSourceUrl || previewAvatarUrl"
    @cancel="onCropCancel"
    @confirm="onCropConfirm"
  />
</template>

