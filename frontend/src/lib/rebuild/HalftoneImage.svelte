<script lang="ts">
	import { defaultHalftoneOptions, halftonePaletteForTheme, renderHalftone, type HalftoneOptions } from './halftone';

	type Props = {
		src: string;
		alt?: string;
		width?: number;
		height?: number;
		options?: Partial<HalftoneOptions>;
	};

	let { src, alt = '', width = 320, height = 240, options = {} }: Props = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let treatmentState = $state<'idle' | 'ready' | 'fallback'>('idle');
	let theme = $state<string>('cream');
	let renderId = 0;

	$effect(() => {
		theme = document.body.dataset.theme ?? 'cream';
		const observer = new MutationObserver(() => {
			theme = document.body.dataset.theme ?? 'cream';
		});
		observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
		return () => observer.disconnect();
	});

	$effect(() => {
		const target = canvas;
		const requestId = ++renderId;
		const resolved: HalftoneOptions = { ...defaultHalftoneOptions(halftonePaletteForTheme(theme)), ...options };
		if (!target) return;

		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		target.width = Math.round(width * dpr);
		target.height = Math.round(height * dpr);

		void renderHalftone(target, src, { ...resolved, cellSize: resolved.cellSize * dpr }).then((rendered) => {
			if (requestId !== renderId) return;
			treatmentState = rendered ? 'ready' : 'fallback';
		});
	});
</script>

<div class="halftone-media" data-halftone-state={treatmentState} style={`width:${width}px;height:${height}px`}>
	<img class="halftone-original" {src} {alt} loading="lazy" decoding="async" width={width} height={height} />
	<canvas bind:this={canvas} class="halftone-canvas" class:ready={treatmentState === 'ready'} style={`width:${width}px;height:${height}px`} aria-hidden="true"></canvas>
</div>
