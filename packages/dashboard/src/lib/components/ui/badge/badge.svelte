<script lang="ts" module>
	const variantClasses: Record<string, string> = {
		default: "badge-primary",
		secondary: "badge-secondary",
		destructive: "badge-error",
		outline: "badge-outline",
		soft: "badge-soft",
		ghost: "badge-ghost",
		link: "text-primary underline-offset-4 hover:underline",
	};

	export type BadgeVariant = keyof typeof variantClasses;
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	{href}
	class={cn("badge", variantClasses[variant], className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
