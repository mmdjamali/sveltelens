<script lang="ts">
	import { ScrollArea as ScrollAreaPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		orientation = "vertical",
		children,
		...restProps
	}: WithoutChild<ScrollAreaPrimitive.ScrollbarProps> = $props();
</script>

<ScrollAreaPrimitive.Scrollbar
	bind:ref
	data-orientation={orientation}
	{orientation}
	class={cn(
		"flex touch-none p-px transition-colors select-none",
		"data-horizontal:h-2.5 data-horizontal:flex-col",
		"data-vertical:h-full data-vertical:w-2.5",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ScrollAreaPrimitive.Thumb
		class="rounded-full bg-base-300 relative flex-1"
	/>
</ScrollAreaPrimitive.Scrollbar>
