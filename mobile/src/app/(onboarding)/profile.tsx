import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { components } from '@/api/generated';
import { useDeletePhoto, useMe, useSetAvailability, useUploadPhoto } from '@/api/hooks';
import { AuthedImage } from '@/components/AuthedImage';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { StepPage } from '@/components/StepPage';
import { radius, space, type, useColors } from '@/theme';

type Me = components['schemas']['MyProfile'];

/// TimeOfDay on the wire: 0 morning, 1 afternoon, 2 evening, 3 night.
const TIMES = [
  { value: 0, label: 'Morning' },
  { value: 1, label: 'Afternoon' },
  { value: 2, label: 'Evening' },
  { value: 3, label: 'Night' },
];

/// Step 4: a profile photo and when the member is usually free.
/// POST /api/v1/photos + PUT /api/v1/users/me/availability. Seasons are left for later: the
/// API accepts them, but four chips answer the question most people are actually asking.
export default function ProfileSetup() {
  const { data: me, isPending, error, refetch } = useMe();
  return (
    <Screen loading={isPending} error={error} onRetry={refetch}>
      {me ? <PhotoAndTimes me={me} /> : null}
    </Screen>
  );
}

function PhotoAndTimes({ me }: { me: Me }) {
  const c = useColors();
  const router = useRouter();
  const upload = useUploadPhoto();
  const remove = useDeletePhoto();
  const saveTimes = useSetAvailability();
  const hosts = me.role !== 'guest';

  // `me` is refetched after every upload, so the photo shown is always the stored one.
  const photo = me.photos.find((p) => p.type === 0);
  const [times, setTimes] = useState(() => me.availability.map((a) => a.timeOfDay as number));

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // Re-encoded smaller on the device; the server resizes to 2048 px anyway.
      quality: 0.8,
      // iPhones shoot HEIC, which the server cannot read. This asks iOS for a JPEG.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled) return;

    upload.mutate(
      { asset: result.assets[0], type: 0 },
      // Replace, not add: discovery shows a member's profile photo, so there should be one.
      { onSuccess: () => photo && remove.mutate(photo.id) }
    );
  }

  function toggleTime(value: number) {
    setTimes((current) => (current.includes(value) ? current.filter((t) => t !== value) : [...current, value]));
  }

  function submit() {
    saveTimes.mutate(
      times.map((timeOfDay) => ({ timeOfDay, seasonStart: null, seasonEnd: null })),
      { onSuccess: () => (hosts ? router.push('/listing') : router.replace('/discover')) }
    );
  }

  const error = upload.error ?? remove.error ?? saveTimes.error;

  return (
    <StepPage
      step={4}
      total={hosts ? 5 : 4}
      title="Your photo and your time"
      subtitle="A clear photo of your face, and when you are usually free."
      cta={hosts ? 'Continue' : 'Finish'}
      loading={saveTimes.isPending}
      disabled={upload.isPending}
      onNext={submit}>
      <View style={styles.photoRow}>
        <View style={[styles.photo, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}>
          {photo ? (
            <AuthedImage path={photo.url} style={StyleSheet.absoluteFill} accessibilityLabel="Your profile photo" />
          ) : (
            <Ionicons name="person-outline" size={40} color={c.textMuted} aria-hidden />
          )}
        </View>
        <View style={styles.photoAction}>
          <Button
            title={photo ? 'Change photo' : 'Add a photo'}
            variant="secondary"
            loading={upload.isPending || remove.isPending}
            onPress={pickPhoto}
          />
          <Text style={[type.caption, { color: c.textMuted }]}>
            Your photo is stripped of location data before anyone sees it.
          </Text>
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[type.label, { color: c.text }]}>When are you usually free?</Text>
        <View style={styles.chips}>
          {TIMES.map((time) => {
            const on = times.includes(time.value);
            return (
              <Pressable
                key={time.value}
                onPress={() => toggleTime(time.value)}
                role="checkbox"
                aria-checked={on}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: on ? c.text : c.surfaceMuted,
                    borderColor: on ? c.text : c.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <Text style={[type.label, { color: on ? c.background : c.text }]}>{time.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[type.caption, { color: c.textMuted }]}>Pick as many as fit. You can change them later.</Text>
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={[type.body, { color: c.danger }]}>
          {error.message}
        </Text>
      ) : null}
    </StepPage>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  photo: {
    width: 112,
    height: 112,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoAction: { flex: 1, gap: space.sm },
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 44,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
