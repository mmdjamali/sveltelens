<script lang="ts" module>
	export const tabsListVariants: Record<string, string> = {
		default: "tabs-box",
		line: "tabs-border",
	};

	export type TabsListVariant = keyof typeof tabsListVariants;
</script>

<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		variant = "default",
		class: className,
		...restProps
	}: TabsPrimitive.ListProps & {
		variant?: TabsListVariant;
	} = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-variant={variant}
	class={cn("tabs", tabsListVariants[variant], className)}
	{...restProps}
/>
