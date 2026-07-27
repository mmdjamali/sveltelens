<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

	const variantClasses: Record<string, string> = {
		default: "btn-primary",
		outline: "btn-outline",
		secondary: "btn-secondary",
		ghost: "btn-ghost",
		destructive: "btn-soft btn-error",
		link: "btn-link",
	};

	const sizeClasses: Record<string, string> = {
		default: "",
		xs: "btn-xs",
		sm: "btn-sm",
		lg: "btn-lg",
		icon: "btn-square",
		"icon-xs": "btn-square btn-xs",
		"icon-sm": "btn-square btn-sm",
		"icon-lg": "btn-square btn-lg",
	};

	export type ButtonVariant = keyof typeof variantClasses;
	export type ButtonSize = keyof typeof sizeClasses;

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		class={cn("btn", variantClasses[variant], sizeClasses[size], className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		class={cn("btn", variantClasses[variant], sizeClasses[size], className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
