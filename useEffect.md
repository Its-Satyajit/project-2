# How to Reduce or Eliminate `useEffect` in a Modern Next.js + React 19.2 Project

This version updates the earlier guide with the React and Next.js features that landed in the last year and matter directly to effect cleanup: React 19 Actions, `useOptimistic`, `useActionState`, `useFormStatus`, `useEffectEvent`, `use`, `<Activity />`, `cacheSignal`, and partial pre-rendering; plus Next.js async request APIs, Cache Components, `use cache`, `cacheLife`, `useLinkStatus`, and navigation hooks. ([React][1])

The short version is still the same: `useEffect` is for synchronizing React with something outside React. But the list of things that can replace it is now much better than it was a year ago, which is nice for once. ([React][2])

---

## 1. What changed recently, and why it matters

### React 19 and 19.2 added real replacements for common effect patterns

React 19 introduced Actions-related primitives like `useActionState`, `useOptimistic`, `<form>` Actions, and `useFormStatus`, which reduce the amount of effect-driven form state you need to hand-roll. React 19.2 added `useEffectEvent`, `<Activity />`, `cacheSignal`, and partial pre-rendering, which all reduce the need for “effect just to keep UI in sync” code. ([React][1])

`useEffectEvent` is especially useful when your effect needs a callback that should always see the latest values without causing resubscription churn. `<Activity />` is useful when you want to hide UI, preserve state, and avoid ad hoc mount/unmount logic. `cacheSignal` is server-side cleanup for cached async work. Partial pre-rendering lets static and dynamic parts of a page be handled more intentionally. ([React][2])

### Next.js 15 and 16 changed request data, caching, and navigation patterns

Next.js 15 made request-time APIs asynchronous, including `cookies()`, `headers()`, `draftMode()`, `params` in layouts, and `searchParams` in pages. Next.js 15.3 added `onNavigate`, `useLinkStatus`, and a client instrumentation hook. Next.js 16 made `cacheComponents` central to the new cache model, added `use cache` and `cacheLife`, and its docs now describe preserving UI state with `Activity` when Cache Components is enabled. ([Next.js][3])

That matters because a lot of older `useEffect` code existed only to read request data after mount, preserve UI state across route changes, or fake navigation state. Those jobs now belong higher up the stack. ([Next.js][3])

### Your installed libraries already cover the other big replacements

TanStack Query v5 has first-class server rendering, hydration, and advanced SSR support for React, Server Components, and the Next.js App Router. TanStack Form is designed as a headless, composition-first form system and has a Next.js App Router + Server Actions guide. Better Auth uses cookie-based session management and provides Next.js integration, so auth is naturally a server-side concern instead of a “fetch session in `useEffect`” concern. ([tanstack.com][4])

---

## 2. Updated rule of thumb

Before writing `useEffect`, ask four questions:

1. Is this talking to the outside world?
2. Can this be computed during render?
3. Can the server do this better?
4. Is there already a library in my stack that models this problem directly?

If the answer is yes to any of the last three, you probably do not need an effect. React’s docs are very explicit that effects are for synchronization with external systems, not for ordinary data flow or derivation. ([React][2])

---

## 3. Decision map: what to use instead

| Problem                         | Better approach                                    | Why it helps                                                 |
| ------------------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Fetching data for a page        | Server Component fetch, `use()`, or TanStack Query | Less loading boilerplate, fewer race conditions, cleaner SSR |
| Reading request-time data       | Async request APIs in Next.js 15+                  | Keeps request data on the server, where it belongs           |
| Copying props into state        | Derive during render or memoize                    | Avoids stale mirrored state                                  |
| Syncing with an external store  | `useSyncExternalStore`                             | Explicit subscription contract, no manual effect cleanup     |
| Submit state and optimistic UI  | `useActionState`, `useOptimistic`, `useFormStatus` | Modern form flow without custom effect orchestration         |
| Form validation and composition | TanStack Form                                      | Less glue code and fewer effect chains                       |
| Auth/session bootstrap          | Better Auth on the server                          | Avoids client-side auth flicker                              |
| Pending navigation UI           | `useLinkStatus`, `loading.js`, route-level UI      | Better than homegrown route listeners                        |
| Preserving hidden UI state      | `<Activity />` with Cache Components               | Preserves state and DOM intentionally                        |

---

## 4. Full before/after examples

## Example A: Fetching data on mount

### Before

```tsx
'use client'

import { useEffect, useState } from 'react'

type Todo = {
  id: number
  title: string
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/todos')
        if (!res.ok) throw new Error('Failed to load todos')
        const data = (await res.json()) as Todo[]
        if (!cancelled) setTodos(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>{error}</p>

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

### After 1: Server Component

```tsx
// app/todos/page.tsx

type Todo = {
  id: number
  title: string
}

async function getTodos(): Promise<Todo[]> {
  const res = await fetch('https://example.com/api/todos', {
    cache: 'no-store',
  })

  if (!res.ok) throw new Error('Failed to load todos')
  return res.json()
}

export default async function Page() {
  const todos = await getTodos()

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

Next.js Server Components are the default for layouts and pages, and Next.js now documents data fetching in Server Components using the `fetch` API or any async I/O such as a database or ORM. Identical `fetch` requests are memoized by default in the component tree, which reduces duplicate work. ([Next.js][5])

### After 2: TanStack Query

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'

type Todo = {
  id: number
  title: string
}

async function getTodos(): Promise<Todo[]> {
  const res = await fetch('/api/todos')
  if (!res.ok) throw new Error('Failed to load todos')
  return res.json()
}

export function TodoList() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  })

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Something broke. Humanity remains consistent.</p>

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

TanStack Query’s docs explicitly support server rendering, hydration, and advanced SSR for React, Server Components, and Next.js App Router. ([tanstack.com][4])

### Pros

* fewer states
* less manual cancellation
* cleaner SSR and hydration paths
* fewer loading bugs

### Cons

* server data needs a server-compatible source
* TanStack Query adds cache concepts
* client-only data still needs client-side loading

---

## Example B: Derived state

### Before

```tsx
'use client'

import { useEffect, useState } from 'react'

type User = {
  id: string
  name: string
  active: boolean
}

export function UserList({ users }: { users: User[] }) {
  const [activeUsers, setActiveUsers] = useState(users)

  useEffect(() => {
    setActiveUsers(users.filter((user) => user.active))
  }, [users])

  return (
    <ul>
      {activeUsers.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### After

```tsx
'use client'

type User = {
  id: string
  name: string
  active: boolean
}

export function UserList({ users }: { users: User[] }) {
  const activeUsers = users.filter((user) => user.active)

  return (
    <ul>
      {activeUsers.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

This is just render-time derivation, so an effect is unnecessary. React’s effect docs warn against using effects for ordinary data flow, and the newer hook set gives you better tools for stateful UI when you do actually need it. ([React][2])

### When to use `useMemo`

```tsx
'use client'

import { useMemo } from 'react'

type User = {
  id: string
  name: string
  active: boolean
}

export function UserList({ users }: { users: User[] }) {
  const activeUsers = useMemo(() => {
    return users.filter((user) => user.active)
  }, [users])

  return (
    <ul>
      {activeUsers.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### Pros

* one source of truth
* no mirrored state
* simpler debugging

### Cons

* expensive derivations still need care
* `useMemo` is not a magic performance charm, despite the way people wave it around

---

## Example C: External subscriptions

### Before

```tsx
'use client'

import { useEffect, useState } from 'react'
import { themeStore } from './theme-store'

export function ThemeLabel() {
  const [theme, setTheme] = useState(themeStore.getSnapshot())

  useEffect(() => {
    const unsubscribe = themeStore.subscribe(() => {
      setTheme(themeStore.getSnapshot())
    })

    return unsubscribe
  }, [])

  return <p>Theme: {theme}</p>
}
```

### After

```tsx
'use client'

import { useSyncExternalStore } from 'react'
import { themeStore } from './theme-store'

export function ThemeLabel() {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot
  )

  return <p>Theme: {theme}</p>
}
```

`useSyncExternalStore` is the right primitive for external store subscriptions. It removes manual subscribe/unsubscribe plumbing from `useEffect` and fits React’s concurrent rendering model better than ad hoc effect logic. ([React][6])

### Pros

* explicit subscription contract
* less cleanup code
* safer under concurrent rendering

### Cons

* only useful for true external stores
* not a generic replacement for all async behavior

---

## Example D: Forms, submit state, and optimistic UI

### Before

```tsx
'use client'

import { useEffect, useState } from 'react'

export function ProfileForm() {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!saved) return

    const timer = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [saved])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    await fetch('/api/profile', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })

    setSaving(false)
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit" disabled={saving}>
        Save
      </button>
      {saved && <p>Saved</p>}
    </form>
  )
}
```

### After: React Actions

```tsx
'use client'

import { useActionState, useOptimistic, useFormStatus } from 'react'

async function saveProfile(prevState: { name: string }, formData: FormData) {
  const name = String(formData.get('name') ?? '')
  await fetch('/api/profile', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })

  return { name }
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      Save
    </button>
  )
}

export function ProfileForm() {
  const [state, action] = useActionState(saveProfile, { name: '' })
  const [optimisticState, setOptimisticState] = useOptimistic(state)

  return (
    <form
      action={action}
      onSubmit={() => setOptimisticState({ name: 'Saving...' })}
    >
      <input name="name" defaultValue={state.name} />
      <SubmitButton />
      <p>{optimisticState.name}</p>
    </form>
  )
}
```

React 19’s Actions model is specifically meant to handle forms, pending state, optimistic updates, and action results without the old effect soup. `useFormStatus` exposes the current form submission status, `useActionState` stores the action result, and `useOptimistic` lets you update the UI before the server responds. ([React][1])

### After: TanStack Form + Server Actions

```tsx
'use client'

import { useForm } from '@tanstack/react-form'

async function updateProfileAction(values: { name: string }) {
  // server action or mutation
}

export function ProfileForm() {
  const form = useForm({
    defaultValues: {
      name: '',
    },
    onSubmit: async ({ value }) => {
      await updateProfileAction(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="name"
        children={(field) => (
          <input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      />
      <button type="submit">Save</button>
    </form>
  )
}
```

TanStack Form is a headless, composition-first form library, and its React docs include a Next.js App Router and Server Actions guide. That makes it a strong replacement for effect-heavy form orchestration. ([tanstack.com][7])

### Pros

* submit status becomes explicit
* optimistic UI is built into the model
* less effect-driven “saved / resetting / pending” code

### Cons

* there is still some framework learning cost
* focus management and some UI-only behaviors may still need effects

---

## Example E: Auth/session bootstrap

### Before

```tsx
'use client'

import { useEffect, useState } from 'react'

type Session = {
  user: {
    name: string
  } | null
}

export function Navbar() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/session')
      const data = await res.json()
      setSession(data)
    }

    load()
  }, [])

  return <div>{session?.user ? `Hi, ${session.user.name}` : 'Guest'}</div>
}
```

### After

```tsx
// app/layout.tsx
import { NavbarClient } from './navbar-client'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionOnServer()

  return (
    <>
      <NavbarClient session={session} />
      {children}
    </>
  )
}
```

Better Auth’s session management is cookie-based, the server verifies the cookie on each request, and its Next.js integration is explicitly documented. Better Auth also documents server-side access where the server provides a `session` object from request headers. That makes server-side bootstrap the natural path for auth state. ([Better Auth][8])

### Pros

* avoids login flicker
* fewer client requests
* cleaner request-time auth flow

### Cons

* server context is now required for auth-aware layouts
* client-only auth flows still need client-side logic

---

## Example F: Route transitions and pending UI

### Before

```tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function RouteProgress() {
  const pathname = usePathname()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setPending(false)
  }, [pathname])

  return pending ? <div>Loading...</div> : null
}
```

### After

```tsx
'use client'

import Link from 'next/link'
import { useLinkStatus } from 'next/link'

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { pending } = useLinkStatus(href)

  return (
    <Link href={href}>
      {children}
      {pending ? <span>...</span> : null}
    </Link>
  )
}
```

Next.js 15.3 added `useLinkStatus` to track the pending state of a `<Link>` and recommends route-level fallbacks like `loading.js` for bigger transitions. It also added `onNavigate` for routing control and client instrumentation hooks. ([Next.js][9])

### Pros

* better fit for navigation state
* less custom routing glue
* route-level loading becomes a framework concern

### Cons

* only useful for navigation-related feedback
* larger app loading patterns may still need `loading.js` or Suspense

---

## Example G: Preserving UI state across navigations

This is one of the biggest “new feature, old effect replacement” shifts in Next.js 16.

With Cache Components enabled, Next.js preserves state and DOM out of the box using React’s `<Activity />`. The docs say this preserves things like form drafts, scroll positions, expanded details, and playback progress, while allowing other UI to be hidden or evicted as needed. Before that, people often used external stores, hoisted state, or awkward effect-driven remount behavior. ([Next.js][10])

### Before

```tsx
'use client'

import { useEffect } from 'react'

export function DraftResetter({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) {
      // manually stash draft state somewhere
    }
  }, [active])

  return null
}
```

### After

Use Cache Components and let Next.js preserve the UI state that should survive navigation. Route segments can be cached with `use cache` and controlled with `cacheLife`, while `Activity` handles hidden preserved trees. ([Next.js][11])

### Pros

* preserves user work automatically
* less manual state hoisting
* cleaner navigation UX

### Cons

* you need to think carefully about what should reset vs preserve
* Cache Components changes some old route-segment assumptions

---

## 5. When `useEffect` is still the right answer

Keep `useEffect` for things that are actually side effects:

* timers and intervals
* browser event listeners
* imperative third-party widgets
* DOM measurements or browser APIs with no better abstraction
* integrating a legacy library that needs setup and teardown

React still expects effects for this class of work. The modern goal is not to remove every effect. It is to stop using effects as a generic async crutch. ([React][2])

### Example: third-party widget

```tsx
'use client'

import { useEffect, useRef } from 'react'

export function PaymentWidget() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const widget = new ThirdPartyWidget(ref.current)
    widget.mount()

    return () => widget.unmount()
  }, [])

  return <div ref={ref} />
}
```

This is the kind of effect that still belongs there. It does setup and cleanup for an imperative browser-integrated thing. Very rude, very necessary. ([React][2])

---

## 6. Pros and cons of reducing unnecessary effects

### Pros

* simpler data flow
* fewer race conditions
* fewer cleanup bugs
* less mirrored state
* better SSR and first render behavior
* cleaner testing for pure components
* better alignment with the newer React and Next.js model

### Cons

* more architectural discipline required
* a steeper learning curve if the team is new to Server Components, Actions, or Cache Components
* some things still do belong in effects
* the client/server split needs to be thought through instead of guessed at

The tradeoff is worth it, but it is still a tradeoff. Shocking, I know. ([Next.js][5])

---

## 7. Recommended migration order

1. Move initial data fetching to Server Components where possible. ([Next.js][5])
2. Use TanStack Query for client-side server state. ([tanstack.com][4])
3. Move auth/session reads to the server with Better Auth. ([Better Auth][8])
4. Convert forms to React Actions or TanStack Form + Server Actions. ([React][1])
5. Replace mirrored state with render-time derivation or `useMemo`. ([React][6])
6. Replace subscription effects with `useSyncExternalStore`. ([React][6])
7. Use `useEffect` only for genuine imperative browser work. ([React][2])

---

## 8. Quick checklist for every new effect

Before adding an effect, check whether you are doing one of these instead:

* fetching data that could be fetched on the server
* copying state that could be derived
* subscribing to a store that has a dedicated hook
* handling form state that React Actions or TanStack Form already model
* reading auth/session state that the server can provide
* implementing navigation UI that Next.js already exposes through route hooks
* preserving state that Cache Components and `Activity` now handle

If none of those fit, keep the effect. If one does fit, delete the effect and feel strangely good about it. ([Next.js][11])

---

## 9. Final summary

The updated 2025-2026 answer is not “avoid `useEffect` because effects are bad.” The answer is:

* use **Server Components**, `use()`, async request APIs, and Cache Components for server-first data and request state
* use **TanStack Query** for client-side server state
* use **React Actions** and **TanStack Form** for forms and optimistic UI
* use **`useEffectEvent`** when effect callbacks were the real problem
* use **`useLinkStatus`** and route-level loading for navigation state
* use **`useSyncExternalStore`** for subscriptions
* use **`<Activity />`** and Cache Components for preserved hidden UI
* keep **`useEffect`** for real browser-side side effects only

That is the modern version. Less superstition, fewer hooks pretending to be architecture, and a little less code that exists only because nobody wanted to think for ten minutes.

[1]: https://react.dev/blog/2024/12/05/react-19 "React v19"
[2]: https://react.dev/blog/2025/10/01/react-19-2 "React 19.2"
[3]: https://nextjs.org/docs/app/guides/upgrading/version-15 "Upgrading: Version 15"
[4]: https://tanstack.com/query/v5/docs/react/guides/ssr "Server Rendering & Hydration | TanStack Query React Docs"
[5]: https://nextjs.org/docs/app/getting-started/server-and-client-components "Getting Started: Server and Client Components"
[6]: https://react.dev/blog/2024/02/15/react-labs-what-we-have-been-working-on-february-2024 "React Labs: What We've Been Working On – February 2024"
[7]: https://tanstack.com/form/latest/docs "Overview | TanStack Form Docs"
[8]: https://better-auth.com/docs/concepts/session-management "Session Management"
[9]: https://nextjs.org/blog/next-15-3 "Next.js 15.3"
[10]: https://nextjs.org/docs/app/guides/preserving-ui-state "Guides: Preserving UI state"
[11]: https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents "next.config.js: cacheComponents"
