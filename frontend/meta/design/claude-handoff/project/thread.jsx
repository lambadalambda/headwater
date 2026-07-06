/* global React, I, VaporBanner, Avatar, PostHead, PostBody, PostPinged, PostCW, PostBoost, PostMedia, PostActions, QuotedPost, Button */
const { useState: useStateT } = React;

// ============ Thread view ============
function ThreadView({ thread, focusedId, onBack, onAction, onReply, replyDraft, setReplyDraft, onVote, inlineReplyTo, onSetInlineReply, inlineReplyDraft, setInlineReplyDraft, onSubmitInlineReply }) {
  const ancestors = thread.ancestors || [];
  const focused = thread.focused;
  const replies = thread.replies || [];
  const remaining = 500 - (replyDraft || '').length;

  return (
    <div className="card thread">
      <div className="thread-head">
        <button className="thread-back" onClick={onBack} aria-label="Back">
          <I.arrowL style={{width: 18, height: 18}}/>
        </button>
        <div className="thread-head-title">Thread</div>
        <button className="tab-action" title="Refresh">
          <svg viewBox="0 0 24 24" fill="none" style={{width: 16, height: 16}}><path d="M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button className="tab-action" title="More"><I.more style={{width: 16, height: 16}}/></button>
      </div>

      {/* Ancestors */}
      {ancestors.length > 0 && (
        <div className="thread-ancestors">
          {ancestors.map((p, i) => (
            <AncestorPost key={p.id} post={p} onAction={onAction} onVote={onVote} hasLine={true}/>
          ))}
        </div>
      )}

      {/* Focused post */}
      <FocusedPost post={focused} onAction={onAction} onVote={onVote} continuesAbove={ancestors.length > 0}/>

      {/* Inline reply composer */}
      <div className="thread-reply-composer">
        <Avatar variant="compose" avBanner="sunset"/>
        <div style={{minWidth: 0, flex: 1}}>
          <textarea
            className="composer-input"
            placeholder={`Reply to ${focused.handle.split('@')[1] ? '@' + focused.handle.split('@')[1] : focused.handle}...`}
            value={replyDraft}
            onChange={e => setReplyDraft(e.target.value)}
            style={{minHeight: 44}}
          />
          <div className="composer-row" style={{borderTop: '1px solid var(--border)'}}>
            <button className="composer-tool" title="Image"><I.image style={{width: 18, height: 18}}/></button>
            <button className="composer-tool" title="Emoji"><I.smile style={{width: 18, height: 18}}/></button>
            <button className="composer-tool cw">CW</button>
            <button className="composer-tool privacy">
              <I.reply style={{width: 13, height: 13}}/>
              <span>Reply</span>
              <I.chevDown style={{width: 12, height: 12}}/>
            </button>
            <span className="composer-spacer"></span>
            <span className="composer-count" style={{color: remaining < 50 ? 'var(--bad)' : 'var(--muted)'}}>{remaining}</span>
            <button className="btn-primary" onClick={onReply} disabled={!(replyDraft || '').trim()}>Reply</button>
          </div>
        </div>
      </div>

      {/* Reply count / sort */}
      <div className="thread-reply-head">
        <div className="thread-reply-count">
          <I.reply style={{width: 13, height: 13, color: 'var(--muted)'}}/>
          <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
        </div>
        <div className="seg" style={{marginLeft: 'auto'}}>
          <button className="active">Top</button>
          <button>Newest</button>
        </div>
      </div>

      {/* Replies */}
      <div className="thread-replies">
        {replies.map((r, i) => (
          <ReplyPost
            key={r.id}
            post={r}
            onAction={onAction}
            onVote={onVote}
            isLast={i === replies.length - 1}
            nestedReplies={r.nestedReplies || []}
            inlineReplyTo={inlineReplyTo}
            onSetInlineReply={onSetInlineReply}
            inlineReplyDraft={inlineReplyDraft}
            setInlineReplyDraft={setInlineReplyDraft}
            onSubmitInlineReply={onSubmitInlineReply}/>
        ))}
        {replies.length === 0 && (
          <div className="thread-empty">No replies yet. Be the first.</div>
        )}
      </div>
    </div>
  );
}

function AncestorPost({ post, onAction, onVote, hasLine }) {
  return (
    <PostBoost post={post}>
      <div className="post post-ancestor">
        <div className="thread-line-wrap">
          <Avatar post={post}/>
          <div className="thread-line"></div>
        </div>
        <div style={{minWidth: 0}}>
          <PostHead post={post}/>
          <PostCW post={post}>
            <PostBody body={post.body} addressees={post.addressees}/>
            <QuotedPost quoted={post.quotedPost}/>
            <PostMedia post={post} onVote={onVote}/>
          </PostCW>
          <PostActions post={post} onAction={(k) => onAction(post.id, k)}/>
        </div>
      </div>
    </PostBoost>
  );
}

function FocusedPost({ post, onAction, onVote, continuesAbove }) {
  const [cwRevealed, setCwRevealed] = useStateT(false);
  const hidden = post.cw && !cwRevealed;
  return (
    <article className="focused-post">
      {continuesAbove && <div className="thread-line-top"></div>}
      <div className="focused-post-head">
        <Avatar post={post} variant="focused"/>
        <div style={{minWidth: 0, flex: 1}}>
          <div className="focused-name">{post.name}</div>
          <div className="focused-handle">{post.handle}</div>
        </div>
        <Button variant="follow" className={post.following ? 'following' : ''}>
          {post.following ? 'Following' : 'Follow'}
        </Button>
        <button className="post-more"><I.more style={{width: 16, height: 16}}/></button>
      </div>

      {hidden && (
        <div className="post-cw-card" onClick={(e) => e.stopPropagation()}>
          <div className="post-cw-head">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{width: 13, height: 13, color: 'var(--warn)'}}>
              <path d="M8 1.5l7 12.5H1L8 1.5z"/><path d="M8 6v4M8 12v.5"/>
            </svg>
            Content warning
          </div>
          <div className="post-cw-summary">{post.cw}</div>
          <div className="post-cw-foot">
            <button className="post-cw-reveal" onClick={() => setCwRevealed(true)}>Show post</button>
            <button className="post-cw-link">Always show from @{post.handle ? post.handle.split('@').filter(Boolean)[0] : 'author'} →</button>
          </div>
        </div>
      )}

      {!hidden && post.cw && (
        <div className="post-cw-revealed-summary">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{width: 13, height: 13}}>
            <path d="M8 1.5l7 12.5H1L8 1.5z"/><path d="M8 6v4M8 12v.5"/>
          </svg>
          <span className="post-cw-revealed-l">CW</span>
          <span className="post-cw-revealed-text">{post.cw}</span>
          <button className="post-cw-revealed-hide" onClick={() => setCwRevealed(false)}>Hide</button>
        </div>
      )}

      {!hidden && (
        <React.Fragment>
          <div className="focused-body">{post.body}</div>
          {post.quotedPost && <QuotedPost quoted={post.quotedPost}/>}
          <PostPinged addressees={post.addressees} focused={true}/>

          {post.media && (
            <div className="focused-media">
              <VaporBanner variant={post.media}/>
            </div>
          )}

          {post.attachments && post.attachments.length > 0 && (
            <div className="focused-media-attach">
              <PostMedia post={post} onVote={onVote}/>
            </div>
          )}
        </React.Fragment>
      )}

      <div className="focused-meta">
        <span>{post.fullTime || '4:18 PM · May 11, 2026'}</span>
        <span className="dot">·</span>
        <span>{post.source || 'PleromaNet™ Web'}</span>
        <span className="dot">·</span>
        <span><strong>{post.views || '12.4K'}</strong> views</span>
      </div>

      <div className="focused-actions">
        <button className="focused-action">
          <I.reply/>
          <span>Reply</span>
          {post.replies > 0 && <span className="focused-action-c">{post.replies}</span>}
        </button>
        <button className={"focused-action " + (post.actions.boost ? 'on' : '')} onClick={() => onAction(post.id, 'boost')}>
          <I.boost/>
          <span>Boost</span>
          {(post.boosts + (post.actions.boost ? 1 : 0)) > 0 && <span className="focused-action-c">{post.boosts + (post.actions.boost ? 1 : 0)}</span>}
        </button>
        <button className={"focused-action " + (post.actions.fav ? 'on' : '')} onClick={() => onAction(post.id, 'fav')}>
          <I.star fill={post.actions.fav ? 'currentColor' : 'none'}/>
          <span>Favorite</span>
          {(post.favs + (post.actions.fav ? 1 : 0)) > 0 && <span className="focused-action-c">{post.favs + (post.actions.fav ? 1 : 0)}</span>}
        </button>
        <button className="focused-action">
          <I.bookmark/>
          <span>Save</span>
          {(post.bookmarks || 0) > 0 && <span className="focused-action-c">{post.bookmarks}</span>}
        </button>
        <button className="focused-action">
          <I.ext/>
          <span>Share</span>
        </button>
      </div>
    </article>
  );
}

function ReplyPost({ post, onAction, onVote, isLast, nestedReplies, depth = 0, inlineReplyTo, onSetInlineReply, inlineReplyDraft, setInlineReplyDraft, onSubmitInlineReply }) {
  const [showNested, setShowNested] = useStateT(false);
  const isReplyTarget = inlineReplyTo === post.id;
  const handleReply = (k) => {
    if (k === 'reply') {
      onSetInlineReply && onSetInlineReply(isReplyTarget ? null : post.id);
    } else {
      onAction(post.id, k);
    }
  };
  return (
    <React.Fragment>
      <PostBoost post={post}>
        <div className={"post post-reply " + (isLast && nestedReplies.length === 0 && !isReplyTarget ? 'post-reply-last' : '') + (isReplyTarget ? ' post-reply-target' : '')}>
          <div className="thread-line-wrap">
            <Avatar post={post}/>
            {(nestedReplies.length > 0 || depth > 0 || isReplyTarget) && !isLast && <div className="thread-line"></div>}
          </div>
          <div style={{minWidth: 0}}>
            <PostHead post={post}/>
            <PostCW post={post}>
              <PostBody body={post.body} addressees={post.addressees}/>
              <QuotedPost quoted={post.quotedPost}/>
              <PostMedia post={post} onVote={onVote}/>
            </PostCW>
            <PostActions post={post} onAction={handleReply}/>
            {nestedReplies.length > 0 && !showNested && (
              <button className="show-replies" onClick={() => setShowNested(true)}>
                <span className="show-replies-line"></span>
                Show {nestedReplies.length} {nestedReplies.length === 1 ? 'reply' : 'replies'} →
              </button>
            )}
          </div>
        </div>
      </PostBoost>
      {isReplyTarget && (
        <InlineReplyComposer
          target={post}
          draft={inlineReplyDraft}
          setDraft={setInlineReplyDraft}
          onCancel={() => onSetInlineReply(null)}
          onSubmit={() => onSubmitInlineReply && onSubmitInlineReply(post.id)}
        />
      )}
      {showNested && nestedReplies.length > 0 && (
        <div className="nested-replies">
          {nestedReplies.map((r, i) => (
            <ReplyPost
              key={r.id}
              post={r}
              onAction={onAction}
              onVote={onVote}
              isLast={i === nestedReplies.length - 1}
              nestedReplies={r.nestedReplies || []}
              depth={depth + 1}
              inlineReplyTo={inlineReplyTo}
              onSetInlineReply={onSetInlineReply}
              inlineReplyDraft={inlineReplyDraft}
              setInlineReplyDraft={setInlineReplyDraft}
              onSubmitInlineReply={onSubmitInlineReply}
            />
          ))}
        </div>
      )}
    </React.Fragment>
  );
}

// Inline reply composer (V1 — slides in below the targeted post)
function InlineReplyComposer({ target, draft, setDraft, onCancel, onSubmit }) {
  const remaining = 500 - (draft || '').length;
  const targetHandle = '@' + (target.handle || '').split('@').filter(Boolean)[0];
  return (
    <div className="thread-inline-reply">
      <div className="thread-inline-reply-av"/>
      <div>
        <div className="thread-inline-reply-addr">
          <span>Replying to</span>
          <span className="thread-inline-reply-addr-chip">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{width: 10, height: 10}}>
              <path d="M6 4L2 8l4 4"/><path d="M2 8h7a4 4 0 014 4v1"/>
            </svg>
            {targetHandle}
          </span>
        </div>
        <textarea
          placeholder={`Reply to ${targetHandle}…`}
          value={draft || ''}
          onChange={e => setDraft(e.target.value)}
          autoFocus
        />
        <div className="thread-inline-reply-row">
          <button className="thread-inline-reply-tool" title="Image"><I.image style={{width: 16, height: 16}}/></button>
          <button className="thread-inline-reply-tool" title="Emoji"><I.smile style={{width: 16, height: 16}}/></button>
          <button className="thread-inline-reply-tool" title="Poll"><I.poll style={{width: 16, height: 16}}/></button>
          <button className="thread-inline-reply-cw">CW</button>
          <span className="thread-inline-reply-spacer"/>
          <button className="thread-inline-reply-cancel" onClick={onCancel}>Cancel</button>
          <span className="thread-inline-reply-count" style={{color: remaining < 50 ? 'var(--bad)' : 'var(--muted)'}}>{remaining}</span>
          <button className="thread-inline-reply-submit" onClick={onSubmit} disabled={!(draft || '').trim()}>Reply</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ThreadView, AncestorPost, FocusedPost, ReplyPost, InlineReplyComposer });
