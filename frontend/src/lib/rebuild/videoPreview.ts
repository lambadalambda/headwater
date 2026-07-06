export const VIDEO_PREVIEW_TIME_SECONDS = 1;

const previewTimeForDuration = (duration: number, previewTime: number) => {
	if (!Number.isFinite(duration) || duration <= 0) return previewTime;
	return Math.max(0, Math.min(previewTime, duration - 0.05));
};

export const seekVideoPreviewFrame = (node: HTMLVideoElement, previewTime = VIDEO_PREVIEW_TIME_SECONDS) => {
	const target = previewTimeForDuration(node.duration, previewTime);
	if (target <= 0) return false;

	try {
		node.currentTime = target;
		return true;
	} catch {
		return false;
	}
};

export const primeVideoPreviewFrame = (node: HTMLVideoElement, previewTime = VIDEO_PREVIEW_TIME_SECONDS) => {
	const poster = node.getAttribute('poster');
	node.removeAttribute('poster');

	const primed = seekVideoPreviewFrame(node, previewTime);
	if (!primed && poster !== null) node.setAttribute('poster', poster);
	return primed;
};

export const resetVideoPreviewOnPlay = (node: HTMLVideoElement, wasPrimed: boolean, previewTime = VIDEO_PREVIEW_TIME_SECONDS) => {
	if (!wasPrimed) return false;

	if (node.currentTime <= previewTime + 0.25) {
		try {
			node.currentTime = 0;
		} catch {
			// Some remote media can reject seeking until enough data is buffered.
		}
	}

	return false;
};
