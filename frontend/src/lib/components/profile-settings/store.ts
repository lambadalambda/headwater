import { writable } from 'svelte/store';
import { cloneProfileSettings, createDefaultProfileSettings, type ProfileSettings } from './types';

export const profileSettingsPreview = writable<ProfileSettings>(createDefaultProfileSettings());

export const setProfileSettingsPreview = (profile: ProfileSettings) => {
	profileSettingsPreview.set(cloneProfileSettings(profile));
};
