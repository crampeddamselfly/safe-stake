<script lang="ts">
  import "../app.css"
  import { onMount } from "svelte"
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query"
  import { ModeWatcher } from "mode-watcher"
  import { initAppKit } from "$lib/wallet/appkit"
  import Header from "$lib/components/layout/Header.svelte"
  import Footer from "$lib/components/layout/Footer.svelte"
  import Container from "$lib/components/layout/Container.svelte"
  import { Toaster } from "$lib/components/ui/sonner"

  let { children } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 10_000, retry: 1 }
    }
  })

  onMount(() => initAppKit())
</script>

<ModeWatcher defaultMode="dark" />

<QueryClientProvider client={queryClient}>
  <div class="flex min-h-screen flex-col">
    <Header />
    <main class="flex-1 py-8 md:py-12">
      <Container>
        {@render children()}
      </Container>
    </main>
    <Footer />
  </div>
  <Toaster richColors closeButton />
</QueryClientProvider>
