<script>
	let { children } = $props();
</script>

<svelte:head>
	<title>JSON Beautifier</title>
	<meta name="description" content="Paste JSON and get it beautifully formatted. No data stored." />
</svelte:head>

{@render children()}
