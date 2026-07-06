import { expect, test } from '@playwright/test';
import { renderBodyText } from './mentions';

test('renderBodyText autolinks safe HTTP URLs without losing query strings', () => {
	const url = 'https://news.ycombinator.com/item?id=47637828';

	expect(renderBodyText(`${url} neat project`)).toEqual([
		{ kind: 'link', key: 'l0', text: url, href: url },
		' neat project'
	]);
});

test('renderBodyText keeps sentence punctuation outside autolinks', () => {
	expect(renderBodyText('read (https://example.com/project).')).toEqual([
		'read (',
		{ kind: 'link', key: 'l0', text: 'https://example.com/project', href: 'https://example.com/project' },
		').'
	]);
});

test('renderBodyText ignores unsafe schemes while preserving mentions and emoji', () => {
	expect(renderBodyText('javascript:alert(1) @lain :blobcat: https://example.com', [
		{ shortcode: 'blobcat', url: 'https://cdn.example/blobcat.png' }
	])).toEqual([
		'javascript:alert(1) ',
		{ kind: 'mention', key: 'm0', text: '@lain' },
		' ',
		{ kind: 'emoji', key: 'e1', shortcode: 'blobcat', url: 'https://cdn.example/blobcat.png', staticUrl: undefined },
		' ',
		{ kind: 'link', key: 'l2', text: 'https://example.com', href: 'https://example.com/' }
	]);
});
