export const normalizedProfileHandle = (handle: string | null | undefined) => handle?.trim().replace(/^@/, '') ?? '';

export const profileHref = (handle: string | null | undefined) => {
	const normalized = normalizedProfileHandle(handle);
	return normalized ? `/app/profiles/${encodeURIComponent(normalized)}` : null;
};
