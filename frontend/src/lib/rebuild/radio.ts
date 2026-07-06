export type RadioTrack = {
	t: string;
	d: string;
};

export type RadioAlbum = {
	id: string;
	title: string;
	artist: string;
	year: string;
	genre: string;
	license: string;
	coverInitial: string;
	coverGrad: string;
	tint: string;
	tracks: RadioTrack[];
};

export type RadioView = 'now' | 'albums';

export const RADIO_ALBUMS: RadioAlbum[] = [
	{
		id: 'modem-hymns',
		title: 'Modem Hymns',
		artist: 'static.gif',
		year: '2024',
		genre: 'Chiptune',
		license: 'CC BY 4.0',
		coverInitial: 'M',
		coverGrad: 'linear-gradient(135deg, #2a6f8a 0%, #7dc4be 55%, #e0b97a 100%)',
		tint: '#7dc4be',
		tracks: [
			{ t: '56k handshake', d: '2:14' },
			{ t: 'BBS reverie', d: '3:48' },
			{ t: 'floppy boot loop', d: '1:52' },
			{ t: 'ascii sunrise', d: '4:21' },
			{ t: "sysop's lullaby", d: '5:06' },
			{ t: 'phosphor screen', d: '3:12' },
			{ t: 'end of file', d: '2:44' },
		],
	},
	{
		id: 'plaza-fm',
		title: 'Plaza FM',
		artist: 'Vapor Garden Collective',
		year: '2023',
		genre: 'Vaporwave',
		license: 'CC0 - Public domain',
		coverInitial: 'P',
		coverGrad: 'linear-gradient(135deg, #e7a8c9 0%, #a48bd9 60%, #6e4f9e 100%)',
		tint: '#e7a8c9',
		tracks: [
			{ t: 'pink marble', d: '4:12' },
			{ t: 'roman bust 2/4', d: '3:55' },
			{ t: 'mall dream', d: '6:08' },
			{ t: 'cassette tape', d: '4:44' },
			{ t: 'slow fountain', d: '5:30' },
			{ t: 'palm-court muzak', d: '4:02' },
		],
	},
	{
		id: 'outer-drive',
		title: 'Outer Drive',
		artist: 'neon.cassette',
		year: '2025',
		genre: 'Retrowave',
		license: 'CC BY-NC 4.0',
		coverInitial: 'O',
		coverGrad: 'linear-gradient(135deg, #1a1538 0%, #6e4f9e 45%, #e7a8c9 100%)',
		tint: '#a48bd9',
		tracks: [
			{ t: 'coastline 1986', d: '4:48' },
			{ t: 'highway static', d: '3:22' },
			{ t: 'pacific hour', d: '5:14' },
			{ t: 'rain on glass', d: '4:02' },
			{ t: 'slow synth', d: '6:28' },
			{ t: 'last exit', d: '3:56' },
		],
	},
	{
		id: 'garden-hours',
		title: 'Garden Hours',
		artist: 'warm.process',
		year: '2024',
		genre: 'Ambient',
		license: 'CC BY 4.0',
		coverInitial: 'G',
		coverGrad: 'linear-gradient(135deg, #a8d5b1 0%, #e0b97a 50%, #d68b8b 100%)',
		tint: '#a8d5b1',
		tracks: [
			{ t: 'first light', d: '7:14' },
			{ t: 'tea & modems', d: '5:30' },
			{ t: 'patch cable', d: '4:48' },
			{ t: 'afternoon drift', d: '8:22' },
			{ t: 'garden closed', d: '6:04' },
		],
	},
];

export const parseDuration = (value: string): number => {
	const [minutes, seconds] = value.split(':').map(Number);
	return minutes * 60 + seconds;
};

export const formatDuration = (time: number): string => {
	const minutes = Math.floor(time / 60);
	const seconds = Math.floor(time % 60);
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const radioAlbum = (id: string): RadioAlbum =>
	RADIO_ALBUMS.find((album) => album.id === id) ?? RADIO_ALBUMS[0];
