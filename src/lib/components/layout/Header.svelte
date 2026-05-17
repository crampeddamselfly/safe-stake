<script lang="ts">
  import { page } from "$app/state"
  import Container from "./Container.svelte"
  import Logo from "./Logo.svelte"
  import ThemeToggle from "$lib/components/theme/ThemeToggle.svelte"
  import ConnectButton from "$lib/components/wallet/ConnectButton.svelte"
  import SettingsButton from "$lib/components/settings/SettingsButton.svelte"
  import { cn } from "$lib/utils/cn"

  const navItems = [
    { href: "/", label: "Validators" },
    { href: "/withdrawals", label: "Withdrawals" },
    { href: "/rewards", label: "Rewards" }
  ]
</script>

<header class="sticky top-0 z-40 w-full sm:pt-4">
  <Container>
    <div
      class={cn(
        "flex h-14 items-center justify-between gap-3 px-3 md:h-16 md:px-4",
        "border-b border-border/60 bg-background/80 backdrop-blur-md",
        "supports-[backdrop-filter]:bg-background/55",
        "sm:rounded-2xl sm:border sm:shadow-lg sm:shadow-foreground/5"
      )}
    >
      <div class="flex items-center gap-6">
        <Logo />
        <nav aria-label="Primary" class="hidden items-center gap-1 text-sm md:flex">
          {#each navItems as item (item.href)}
            <a
              href={item.href}
              class={cn(
                "rounded-md px-3 py-1.5 transition-colors",
                "text-muted-foreground hover:bg-accent hover:text-foreground",
                page.url.pathname === item.href && "font-medium text-foreground"
              )}
              aria-current={page.url.pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </a>
          {/each}
        </nav>
      </div>
      <div class="flex items-center gap-1.5">
        <SettingsButton />
        <ThemeToggle />
        <ConnectButton />
      </div>
    </div>
  </Container>
</header>
