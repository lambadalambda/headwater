const DEFAULT_AVATAR_FALLBACK_CLASS = 'av-orb';

export const avatarFallbackClassName = (className?: string | null) => {
	const trimmed = className?.trim();
	return `avatar-fallback ${trimmed || DEFAULT_AVATAR_FALLBACK_CLASS}`;
};

export const applyAvatarImageFallback = (image: HTMLImageElement, className?: string | null) => {
	const parent = image.parentElement;
	image.classList.add('avatar-img-failed');
	if (!parent) return;

	for (const token of avatarFallbackClassName(className).split(/\s+/)) parent.classList.add(token);
};
