export type PleromaResourceState<Data> =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'success'; data: Data }
	| { status: 'error'; error: unknown };

export const createPleromaResource = <Data>() => {
	let state: PleromaResourceState<Data> = { status: 'idle' };
	let loadVersion = 0;

	return {
		getState: () => state,
		load: async (loader: () => Promise<Data>) => {
			const version = loadVersion + 1;
			loadVersion = version;
			state = { status: 'loading' };

			try {
				const data = await loader();
				if (version === loadVersion) state = { status: 'success', data };
				return state;
			} catch (error) {
				if (version === loadVersion) state = { status: 'error', error };
				return state;
			}
		}
	};
};
