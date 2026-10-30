import { useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Loader, AlertCircle, CheckCircle } from 'lucide-react'
import { useLang } from '@/contexts/LangContext'
import { profileApi, geocodeApi, type BirthProfileCreate, type PlaceResult } from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AxiosError } from 'axios'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  time_of_birth: z.string().optional(),
  time_unknown: z.boolean(),
  birthplace_name: z.string().min(1, 'Birthplace is required'),
  latitude: z.number({ message: 'Select a valid place from the dropdown' }),
  longitude: z.number({ message: 'Select a valid place from the dropdown' }),
  timezone_str: z.string().min(1, 'Timezone is required'),
  gender: z.string().optional(),
  notes: z.string().max(500).optional(),
})

type FormData = z.infer<typeof schema>

export default function BirthFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { t } = useLang()
  const isEdit = !!id

  const [placeQuery, setPlaceQuery] = useState('')
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceResult[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [timeUnknown, setTimeUnknown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Load existing profile if editing
  const { data: existingProfile } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => profileApi.get(id!),
    enabled: isEdit,
  })

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: existingProfile ? {
      name: existingProfile.name,
      date_of_birth: existingProfile.date_of_birth,
      time_of_birth: existingProfile.time_of_birth || '',
      time_unknown: existingProfile.time_unknown,
      birthplace_name: existingProfile.birthplace_name,
      latitude: existingProfile.latitude,
      longitude: existingProfile.longitude,
      timezone_str: existingProfile.timezone_str,
      gender: existingProfile.gender || '',
    } : { time_unknown: false },
  })

  const watchedDate = watch('date_of_birth')
  const watchedTimezone = watch('timezone_str')

  const searchPlaces = useCallback((query: string) => {
    clearTimeout(debounceRef.current)
    if (query.length < 2) { setPlaceSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const results = await geocodeApi.search(query)
        setPlaceSuggestions(results)
      } catch {}
      finally { setSearchLoading(false) }
    }, 400)
  }, [])

  const selectPlace = (place: PlaceResult) => {
    setSelectedPlace(place)
    setPlaceQuery(place.short_name)
    setPlaceSuggestions([])
    setValue('birthplace_name', place.short_name, { shouldValidate: true })
    setValue('latitude', place.latitude, { shouldValidate: true })
    setValue('longitude', place.longitude, { shouldValidate: true })
    setValue('timezone_str', place.timezone, { shouldValidate: true })
  }

  const createMutation = useMutation({
    mutationFn: (data: BirthProfileCreate) => profileApi.create(data),
    onSuccess: (profile) => {
      toast.success('Profile saved! Calculating chart...')
      navigate(`/profile/${profile.id}/kundli`)
    },
    onError: (err: AxiosError<{ detail: string }>) => {
      toast.error(err.response?.data?.detail || 'Failed to save profile')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<BirthProfileCreate>) => profileApi.update(id!, data),
    onSuccess: (profile) => {
      toast.success('Profile updated!')
      navigate(`/profile/${profile.id}/kundli`)
    },
    onError: (err: AxiosError<{ detail: string }>) => {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    },
  })

  const onSubmit = (data: FormData) => {
    const payload: BirthProfileCreate = {
      ...data,
      time_of_birth: timeUnknown ? undefined : data.time_of_birth,
      time_unknown: timeUnknown,
    }
    if (isEdit) updateMutation.mutate(payload)
    else createMutation.mutate(payload)
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div style={{ padding: '2rem 0 4rem', minHeight: 'calc(100vh - 140px)' }}>
      <div className="container-app" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 0.5rem', color: 'var(--color-plum-900)' }}>
            {t.birth_form_title}
          </h1>
          <p style={{ color: 'var(--color-plum-500)', margin: 0 }}>{t.birth_form_sub}</p>
        </div>

        {/* Accuracy notice */}
        <div style={{
          display: 'flex', gap: '0.75rem', padding: '1rem',
          background: 'var(--color-gold-50)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-gold-200)', marginBottom: '1.5rem',
        }}>
          <AlertCircle size={18} style={{ color: 'var(--color-gold-600)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-plum-700)', lineHeight: 1.55 }}>
            Exact birth time significantly affects Ascendant (Lagna) and house positions.
            If you don't know your exact time, enable "Time Unknown" and we'll note this clearly.
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Name */}
            <div>
              <label className="label">{t.name_field}</label>
              <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="Arjun Sharma" id="profile-name" />
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>

            {/* Date of birth */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">{t.dob_field}</label>
                <input {...register('date_of_birth')} type="date" className={`input ${errors.date_of_birth ? 'input-error' : ''}`}
                  max={new Date().toISOString().split('T')[0]} id="date_of_birth" />
                {errors.date_of_birth && <p className="error-text">{errors.date_of_birth.message}</p>}
              </div>

              <div>
                <label className="label">{t.tob_field}</label>
                <input {...register('time_of_birth')} type="time" className="input"
                  disabled={timeUnknown} id="time_of_birth"
                  style={{ opacity: timeUnknown ? 0.5 : 1 }} />
              </div>
            </div>

            {/* Time unknown toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={timeUnknown}
                onChange={(e) => {
                  setTimeUnknown(e.target.checked)
                  setValue('time_unknown', e.target.checked)
                }}
                style={{ width: 16, height: 16, accentColor: 'var(--color-plum-600)' }}
                id="time-unknown"
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--color-plum-600)' }}>{t.tob_unknown}</span>
            </label>

            {/* Birthplace */}
            <div>
              <label className="label">{t.birthplace_field}</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{
                  position: 'absolute', left: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--color-plum-400)',
                }} />
                <input
                  type="text"
                  value={placeQuery}
                  onChange={(e) => {
                    setPlaceQuery(e.target.value)
                    searchPlaces(e.target.value)
                  }}
                  className={`input ${errors.birthplace_name ? 'input-error' : ''}`}
                  placeholder={t.birthplace_placeholder}
                  style={{ paddingLeft: '2.5rem' }}
                  id="birthplace"
                  autoComplete="off"
                />
                {searchLoading && (
                  <div style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}>
                    <Loader size={14} className="spin" style={{ color: 'var(--color-plum-400)' }} />
                  </div>
                )}

                {/* Dropdown */}
                {placeSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: '#fff', borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-modal)',
                    border: '1px solid rgba(155,142,196,0.2)',
                    zIndex: 50, maxHeight: 280, overflowY: 'auto',
                  }}>
                    {placeSuggestions.map((place, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectPlace(place)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '0.625rem 0.875rem',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          borderBottom: i < placeSuggestions.length - 1 ? '1px solid rgba(155,142,196,0.1)' : 'none',
                          display: 'flex', flexDirection: 'column', gap: '0.125rem',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-plum-50)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-plum-800)', fontWeight: 500 }}>{place.short_name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-plum-400)' }}>{place.timezone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.birthplace_name && <p className="error-text">{errors.birthplace_name.message}</p>}
              {errors.latitude && <p className="error-text">Please select a place from the dropdown</p>}

              {/* Hidden fields */}
              <input type="hidden" {...register('latitude', { valueAsNumber: true })} />
              <input type="hidden" {...register('longitude', { valueAsNumber: true })} />
              <input type="hidden" {...register('timezone_str')} />
              <input type="hidden" {...register('birthplace_name')} />

              {selectedPlace && (
                <div style={{
                  marginTop: '0.5rem',
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  fontSize: '0.8rem', color: 'var(--color-plum-500)',
                }}>
                  <CheckCircle size={13} style={{ color: 'green' }} />
                  {selectedPlace.latitude.toFixed(4)}°N, {selectedPlace.longitude.toFixed(4)}°E · {selectedPlace.timezone}
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="label">{t.gender_field}</label>
              <select {...register('gender')} className="input" id="gender">
                <option value="">Prefer not to say</option>
                <option value="male">{t.gender_male}</option>
                <option value="female">{t.gender_female}</option>
                <option value="other">{t.gender_other}</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes (optional)</label>
              <textarea {...register('notes')} className="input" rows={2}
                placeholder="Any additional notes about this birth profile..."
                style={{ resize: 'vertical' }} id="notes" />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                {t.cancel}
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting} id="save-profile" style={{ flex: 1 }}>
                {isSubmitting && <Loader size={16} className="spin" />}
                {t.calculate_btn}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
