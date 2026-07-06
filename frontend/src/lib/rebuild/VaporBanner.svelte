<script lang="ts">
	import type { BannerVariant } from './attachments';

	type Props = {
		variant?: BannerVariant;
		className?: string;
	};

	let { variant = 'sunset', className = '' }: Props = $props();
</script>

{#if variant === 'pixel-window'}
	<div class={`pw-banner ${className}`.trim()}>
		<div class="pw-banner-bar">
			<div class="pw-banner-dot"></div>
			<div class="pw-banner-dot y"></div>
			<div class="pw-banner-dot g"></div>
		</div>
		<div class="pw-banner-content">
			<svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice" style="width: 100%; height: 100%; display: block;">
				<defs>
					<linearGradient id="pw-sky" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#3d2d6a" />
						<stop offset="60%" stop-color="#a48bd9" />
						<stop offset="100%" stop-color="#e7a8c9" />
					</linearGradient>
				</defs>
				<rect width="100" height="60" fill="url(#pw-sky)" />
				<circle cx="72" cy="24" r="6" fill="#fff5d4" opacity="0.95" />
				<circle cx="72" cy="24" r="10" fill="#fff5d4" opacity="0.18" />
				<path d="M0 60 L0 42 L18 30 L32 38 L48 28 L62 36 L80 32 L100 38 L100 60 Z" fill="#2a1f4a" opacity="0.55" />
				<path d="M0 60 L0 48 L20 42 L40 46 L60 40 L80 44 L100 42 L100 60 Z" fill="#3d2d6a" opacity="0.85" />
				<path d="M0 60 L0 52 L25 50 L50 53 L75 50 L100 52 L100 60 Z" fill="#1d1840" />
				{#each Array.from({ length: 14 }) as _, i}
					<rect x="0" y={i * 4.3 + 1} width="100" height="1" fill="rgba(255,255,255,0.05)" />
				{/each}
			</svg>
		</div>
	</div>
{:else if variant === 'city'}
	<svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid slice" class={className} style="width: 100%; height: 100%; display: block;">
		<defs>
			<linearGradient id="city-sky" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#0c0a28" />
				<stop offset="45%" stop-color="#2a1f4a" />
				<stop offset="85%" stop-color="#7e5a92" />
				<stop offset="100%" stop-color="#d889a0" />
			</linearGradient>
			<linearGradient id="city-buildings" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#1a0f30" stop-opacity="0.85" />
				<stop offset="100%" stop-color="#0a0520" />
			</linearGradient>
		</defs>
		<rect width="100" height="50" fill="url(#city-sky)" />
		<g fill="white">
			<circle cx="10" cy="6" r="0.35" opacity="0.8" />
			<circle cx="25" cy="3" r="0.25" opacity="0.6" />
			<circle cx="40" cy="7" r="0.3" opacity="0.7" />
			<circle cx="58" cy="4" r="0.2" opacity="0.5" />
			<circle cx="72" cy="9" r="0.3" opacity="0.8" />
			<circle cx="92" cy="3" r="0.25" opacity="0.6" />
		</g>
		<g transform="translate(80 9)">
			<circle r="3" fill="#fff5d4" opacity="0.9" />
			<circle cx="1.2" r="3" fill="#0c0a28" />
		</g>
		<path d="M0 50 L0 36 L4 36 L4 30 L9 30 L9 33 L14 33 L14 26 L19 26 L19 32 L24 32 L24 22 L29 22 L29 30 L34 30 L34 27 L39 27 L39 32 L44 32 L44 20 L49 20 L49 28 L54 28 L54 25 L59 25 L59 30 L64 30 L64 22 L69 22 L69 27 L74 27 L74 24 L79 24 L79 31 L84 31 L84 28 L89 28 L89 30 L94 30 L94 26 L100 26 L100 50 Z" fill="url(#city-buildings)" />
		<g fill="#ffd1a8" opacity="0.85">
			{#each [[6,33],[10,32],[15,29],[20,28],[25,25],[30,26],[35,30],[40,29],[45,23],[50,24],[55,27],[60,26],[65,25],[70,24],[75,27],[80,28],[85,30],[90,29],[95,28]] as [x,y]}
				<rect x={x - 0.4} y={y} width="0.6" height="0.6" />
			{/each}
		</g>
		<g fill="#f78fb3" opacity="0.7">
			{#each [[7,35],[12,31],[17,28],[27,24],[37,28],[47,26],[57,29],[67,28],[77,30]] as [x,y]}
				<rect x={x - 0.4} y={y} width="0.6" height="0.6" />
			{/each}
		</g>
	</svg>
{:else if variant === 'space'}
	<svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid slice" class={className} style="width: 100%; height: 100%; display: block;">
		<defs>
			<radialGradient id="space-bg" cx="30%" cy="35%" r="85%">
				<stop offset="0%" stop-color="#2a1f4a" />
				<stop offset="45%" stop-color="#15102a" />
				<stop offset="100%" stop-color="#070414" />
			</radialGradient>
			<radialGradient id="space-planet" cx="30%" cy="30%" r="75%">
				<stop offset="0%" stop-color="#c2a8e0" />
				<stop offset="55%" stop-color="#6e4f9e" />
				<stop offset="100%" stop-color="#2a1f4a" />
			</radialGradient>
		</defs>
		<rect width="100" height="50" fill="url(#space-bg)" />
		<g fill="white">
			{#each [[8,6,0.4,0.9],[15,32,0.3,0.6],[22,12,0.5,0.95],[30,42,0.25,0.5],[38,8,0.35,0.8],[45,38,0.3,0.6],[52,4,0.45,0.9],[55,22,0.2,0.5],[63,45,0.3,0.7],[88,10,0.35,0.8],[94,30,0.25,0.55],[82,40,0.4,0.9],[3,22,0.2,0.4],[70,18,0.3,0.7]] as [x,y,r,opacity]}
				<circle cx={x} cy={y} r={r} {opacity} />
			{/each}
		</g>
		<circle cx="42" cy="22" r="0.6" fill="#fff5d4">
			<animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite" />
		</circle>
		<circle cx="60" cy="36" r="0.5" fill="#e7a8c9">
			<animate attributeName="opacity" values="1;0.4;1" dur="3.1s" repeatCount="indefinite" />
		</circle>
		<g transform="translate(72 28) rotate(-18)">
			<ellipse rx="18" ry="3" fill="none" stroke="#e7a8c9" stroke-width="0.6" opacity="0.45" />
			<ellipse rx="18" ry="3" fill="none" stroke="#a48bd9" stroke-width="0.3" opacity="0.8" stroke-dasharray="30 1" />
		</g>
		<circle cx="72" cy="28" r="9" fill="url(#space-planet)" />
		<g transform="translate(72 28) rotate(-18)">
			<path d="M -18 0 A 18 3 0 0 1 18 0" fill="none" stroke="#a48bd9" stroke-width="0.4" opacity="0.5" stroke-dasharray="0 18 30 30" />
		</g>
	</svg>
{:else}
	<svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid slice" class={className} style="width: 100%; height: 100%; display: block;">
		<defs>
			<linearGradient id="sun-sky" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#1d1840" />
				<stop offset="35%" stop-color="#3d2d6a" />
				<stop offset="60%" stop-color="#a8688c" />
				<stop offset="82%" stop-color="#e7a98a" />
				<stop offset="100%" stop-color="#f4cfa1" />
			</linearGradient>
			<radialGradient id="sun-disc" cx="50%" cy="40%" r="55%">
				<stop offset="0%" stop-color="#fff5d4" />
				<stop offset="45%" stop-color="#ffb877" />
				<stop offset="100%" stop-color="#e87d6c" />
			</radialGradient>
			<linearGradient id="sun-glow" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#ffd1a8" stop-opacity="0" />
				<stop offset="100%" stop-color="#ffd1a8" stop-opacity="0.45" />
			</linearGradient>
		</defs>
		<rect width="100" height="50" fill="url(#sun-sky)" />
		<g fill="#fff5d4">
			<circle cx="14" cy="5" r="0.35" opacity="0.9" />
			<circle cx="32" cy="3" r="0.25" opacity="0.7" />
			<circle cx="73" cy="4" r="0.3" opacity="0.85" />
			<circle cx="89" cy="7" r="0.2" opacity="0.6" />
			<circle cx="55" cy="8" r="0.18" opacity="0.5" />
		</g>
		<rect x="0" y="28" width="100" height="14" fill="url(#sun-glow)" />
		<circle cx="50" cy="39" r="13" fill="url(#sun-disc)" />
		<path d="M0 50 L0 41 L18 33 L34 38 L52 30 L66 36 L82 32 L100 36 L100 50 Z" fill="#1d1840" opacity="0.55" />
		<path d="M0 50 L0 44 L14 40 L30 43 L44 39 L62 42 L78 39 L100 42 L100 50 Z" fill="#1d1840" opacity="0.78" />
		<g stroke="#ffd1a8" stroke-linecap="round">
			<line x1="34" y1="45.5" x2="66" y2="45.5" stroke-width="0.25" opacity="0.5" />
			<line x1="40" y1="47" x2="60" y2="47" stroke-width="0.2" opacity="0.35" />
			<line x1="44" y1="48.4" x2="56" y2="48.4" stroke-width="0.15" opacity="0.25" />
		</g>
	</svg>
{/if}
