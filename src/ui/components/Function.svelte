<script lang="ts">
  const { name, params, type }: { name?: string; params: string[][]; type: string } = $props();
</script>

<span class="type">{type}</span>{#if name}&nbsp;{name}{/if}<span class="bracket{!name ? '-type' : ''}">(</span>{#each params as [type, name], i}{#if i > 0},&nbsp;{/if}<span class="type">{type}</span> {name}{/each}<span class="bracket{!name ? '-type' : ''}">)</span>

<style>
  .bracket {
    color: #ffd700;
  }
  .bracket-type {
    color: #da70d6;
  }
  .type {
    color: #569cd6;
  }
</style>
