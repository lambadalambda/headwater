<script lang="ts">
	import { onMount } from 'svelte';
	import OekakiToolIcon, { type OekakiToolId } from './OekakiToolIcon.svelte';

	type Layer = {
		id: number;
		name: string;
		visible: boolean;
	};

	type Props = {
		open?: boolean;
		preview?: boolean;
		onClose?: () => void;
		onAttach?: (dataUrl: string) => void;
	};

	const TOOLS: { id: OekakiToolId; label: string }[] = [
		{ id: 'brush', label: 'Brush' },
		{ id: 'pen', label: 'Pen' },
		{ id: 'eraser', label: 'Eraser' },
		{ id: 'fill', label: 'Fill' },
		{ id: 'eyedrop', label: 'Eyedropper' },
		{ id: 'rect', label: 'Rectangle' },
		{ id: 'circle', label: 'Ellipse' },
		{ id: 'line', label: 'Line' },
		{ id: 'text', label: 'Text' },
	];

	const SWATCHES = [
		'#18203f', '#2a2520', '#7a7c95', '#f4ebd8',
		'#e8763a', '#d68b8b', '#e0b97a', '#a8d5b1',
		'#7dc4be', '#a48bd9', '#6b52a3', '#e7a8c9',
		'#5a4a3a', '#fbfaf3',
	];

	let { open = false, preview = false, onClose, onAttach }: Props = $props();
	let backdropEl = $state<HTMLDivElement | undefined>();
	let canvasEl = $state<HTMLCanvasElement | undefined>();
	let tool = $state<OekakiToolId>('brush');
	let color = $state('#18203f');
	let size = $state(14);
	let opacityPercent = $state(85);
	let flow = $state(60);
	let zoom = $state(100);
	let pos = $state({ x: 0, y: 0 });
	let drawing = false;
	let last: { x: number; y: number } | null = null;
	let layers = $state<Layer[]>([
		{ id: 1, name: 'Background', visible: true },
		{ id: 2, name: 'Layer 2', visible: true },
	]);
	let activeLayer = $state(2);
	let reversedLayers = $derived([...layers].reverse());
	let opacity = $derived(opacityPercent / 100);

	const setupCanvas = () => {
		if (!canvasEl) return;
		canvasEl.width = 800;
		canvasEl.height = 600;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
	};

	const canvasPos = (event: MouseEvent): { x: number; y: number } => {
		if (!canvasEl) return { x: 0, y: 0 };
		const rect = canvasEl.getBoundingClientRect();
		const scaleX = canvasEl.width / rect.width;
		const scaleY = canvasEl.height / rect.height;
		return {
			x: (event.clientX - rect.left) * scaleX,
			y: (event.clientY - rect.top) * scaleY,
		};
	};

	const start = (event: MouseEvent) => {
		if (!canvasEl) return;
		drawing = true;
		const nextPos = canvasPos(event);
		last = nextPos;
		if (tool !== 'fill') return;

		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;
		ctx.fillStyle = color;
		ctx.globalAlpha = opacity;
		ctx.globalCompositeOperation = 'source-over';
		ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
		drawing = false;
	};

	const move = (event: MouseEvent) => {
		if (!canvasEl) return;
		const nextPos = canvasPos(event);
		pos = { x: Math.round(nextPos.x), y: Math.round(nextPos.y) };
		if (!drawing || !last) return;

		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;
		ctx.globalAlpha = opacity;
		ctx.lineWidth = size;
		if (tool === 'eraser') {
			ctx.globalCompositeOperation = 'destination-out';
			ctx.strokeStyle = '#000';
		} else {
			ctx.globalCompositeOperation = 'source-over';
			ctx.strokeStyle = color;
		}
		ctx.beginPath();
		ctx.moveTo(last.x, last.y);
		ctx.lineTo(nextPos.x, nextPos.y);
		ctx.stroke();
		last = nextPos;
	};

	const end = () => {
		drawing = false;
		last = null;
	};

	const clearCanvas = () => {
		if (!canvasEl) return;
		canvasEl.getContext('2d')?.clearRect(0, 0, canvasEl.width, canvasEl.height);
	};

	const addLayer = () => {
		const nextId = Math.max(...layers.map((layer) => layer.id)) + 1;
		layers = [...layers, { id: nextId, name: `Layer ${nextId}`, visible: true }];
		activeLayer = nextId;
	};

	const deleteLayer = () => {
		if (layers.length <= 1) return;
		layers = layers.filter((layer) => layer.id !== activeLayer);
		activeLayer = layers.at(-1)?.id ?? 1;
	};

	const attachToPost = () => {
		if (!canvasEl) return;
		onAttach?.(canvasEl.toDataURL('image/png'));
	};

	const closeFromBackdrop = (event: MouseEvent) => {
		if (preview || event.target !== event.currentTarget) return;
		onClose?.();
	};

	const closeFromKeyboard = (event: KeyboardEvent) => {
		if (preview || event.key !== 'Escape') return;
		onClose?.();
	};

	onMount(setupCanvas);

	$effect(() => {
		if (open) setupCanvas();
	});

	$effect(() => {
		if (!open || preview) return;
		backdropEl?.focus();
	});
</script>

{#if open}
	<div
		bind:this={backdropEl}
		class="oek-backdrop"
		onclick={closeFromBackdrop}
		onkeydown={closeFromKeyboard}
		role="dialog"
		aria-modal={preview ? undefined : 'true'}
		aria-label="oekaki"
		tabindex={preview ? undefined : -1}
	>
		<div class="oek-window">
			<div class="oek-titlebar">
				<span class="oek-dot"></span>
				<span class="oek-title-l">oekaki</span>
				<span class="oek-title-c">~/draft/untitled.png — 800×600 — {layers.length} layers</span>
				<div class="oek-title-tools">
					<button type="button" class="oek-title-btn" title="Minimize" aria-label="Minimize">−</button>
					<button type="button" class="oek-title-btn" title="Maximize" aria-label="Maximize">□</button>
					<button type="button" class="oek-title-btn oek-close" onclick={onClose} title="Close" aria-label="Close oekaki">×</button>
				</div>
			</div>
			<div class="oek-body">
				<div class="oek-rail">
					{#each TOOLS as item, i (item.id)}
						<button type="button" class:sel={tool === item.id} class="oek-rail-btn" title={item.label} aria-label={item.label} onclick={() => (tool = item.id)}>
							<OekakiToolIcon tool={item.id} />
						</button>
						{#if i === 4}<div class="oek-rail-sep"></div>{/if}
					{/each}
				</div>

				<div class="oek-canvas-wrap">
					<div class="oek-canvas-pad">
						<canvas
							bind:this={canvasEl}
							class="oek-canvas"
							onmousedown={start}
							onmousemove={move}
							onmouseup={end}
							onmouseleave={end}
							style={`cursor: ${tool === 'fill' ? 'cell' : 'crosshair'};`}
						></canvas>
					</div>
					<div class="oek-zoom">
						<button type="button" onclick={() => (zoom = Math.max(25, zoom - 25))} aria-label="Zoom out">−</button>
						<span>{zoom}%</span>
						<button type="button" onclick={() => (zoom = Math.min(400, zoom + 25))} aria-label="Zoom in">+</button>
					</div>
					<div class="oek-pos">x:{pos.x} y:{pos.y}</div>
				</div>

				<div class="oek-side">
					<div class="oek-side-sec">
						<div class="oek-side-head">Color <span class="oek-side-head-r">{color.toUpperCase()}</span></div>
						<div class="oek-swatches">
							{#each SWATCHES as swatch}
								<button
									type="button"
									class:sel={color === swatch}
									class="oek-swatch"
									style={`background: ${swatch}; border-color: ${swatch === '#fbfaf3' ? '#c9c4b3' : 'rgba(0,0,0,0.08)'};`}
									onclick={() => (color = swatch)}
									aria-label={swatch}
								></button>
							{/each}
						</div>
						<input type="color" class="oek-color-picker" bind:value={color} aria-label="Custom color" />
					</div>
					<div class="oek-side-sec">
						<div class="oek-side-head">Brush</div>
						<label class="oek-slider-row"><span class="oek-slider-l">Size</span><input type="range" class="oek-slider-input" min="1" max="64" bind:value={size} /><span class="oek-slider-v">{size}</span></label>
						<label class="oek-slider-row"><span class="oek-slider-l">Opacity</span><input type="range" class="oek-slider-input" min="1" max="100" bind:value={opacityPercent} /><span class="oek-slider-v">{opacityPercent}</span></label>
						<label class="oek-slider-row"><span class="oek-slider-l">Flow</span><input type="range" class="oek-slider-input" min="1" max="100" bind:value={flow} /><span class="oek-slider-v">{flow}</span></label>
					</div>
					<div class="oek-side-sec oek-side-grow">
						<div class="oek-side-head">Layers <span class="oek-side-head-r">{layers.length} / 8</span></div>
						<div class="oek-layers">
							{#each reversedLayers as layer (layer.id)}
								<button type="button" class:sel={activeLayer === layer.id} class="oek-layer" onclick={() => (activeLayer = layer.id)}>
									<svg class="oek-layer-eye" viewBox="0 0 24 24" fill="none" style={`opacity:${layer.visible ? 0.7 : 0.2}`} aria-hidden="true">
										<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="1.6" />
										<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6" />
									</svg>
									<span class="oek-layer-th" style={`background: ${layer.id === 1 ? 'var(--border)' : '#18203f'};`}></span>
									<span>{layer.name}</span>
								</button>
							{/each}
						</div>
						<div class="oek-layer-tools">
							<button type="button" title="New layer" aria-label="New layer" onclick={addLayer}>
								<svg viewBox="0 0 24 24" fill="none" style="width:13px;height:13px" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
							</button>
							<button type="button" title="Duplicate" aria-label="Duplicate">
								<svg viewBox="0 0 24 24" fill="none" style="width:13px;height:13px" aria-hidden="true"><rect x="8" y="8" width="12" height="12" stroke="currentColor" stroke-width="1.6" /><path d="M4 16V4h12" stroke="currentColor" stroke-width="1.6" /></svg>
							</button>
							<button type="button" title="Delete" aria-label="Delete" onclick={deleteLayer}>
								<svg viewBox="0 0 24 24" fill="none" style="width:13px;height:13px" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
							</button>
						</div>
					</div>
				</div>
			</div>
			<div class="oek-foot">
				<span class="oek-foot-info">PNG · 800×600 · {tool} · ⌘Z undo</span>
				<button type="button" class="oek-foot-clear" onclick={clearCanvas}>Clear</button>
				<div class="oek-foot-r">
					<button type="button" class="oek-btn">Save draft</button>
					<button type="button" class="oek-btn primary" onclick={attachToPost}>Attach to post</button>
				</div>
			</div>
		</div>
	</div>
{/if}
