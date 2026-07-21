# TypeScript Type Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TypeScript type generation to the JSON Beautifier with toggleable options for interface/type, inline/extracted, and array syntax.

**Architecture:** Pure JavaScript type generation functions in a separate module, integrated into the existing SvelteKit page via UI controls. Type generation happens client-side when user switches to TypeScript tab.

**Tech Stack:** SvelteKit 5, Svelte 5 (Runes mode), vanilla JavaScript (no external dependencies)

## Global Constraints

- All processing client-side, no server logic
- No localStorage, cookies, or tracking
- Static deployment via adapter-static
- Zero external dependencies beyond SvelteKit
- TypeScript generation must handle: string, number, boolean, null, arrays, objects
- Support both `interface` and `type` constructs
- Support both inline and extracted nested object modes
- Support both `T[]` and `Array<T>` array syntax
- Root type name defaults to "Root" but is editable
