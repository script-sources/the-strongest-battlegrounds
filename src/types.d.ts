declare global {
	interface _G {
		["tsb-script"]?: true;
	}

	type CharacterType = "Hunter" | "Cyborg" | "Blade" | "Batter" | "Ninja" | "Bald";
}

export type Node = { next?: Node; item: Destructible };
export type Destructible = (() => unknown) | RBXScriptConnection | thread | { destroy(): void } | { Destroy(): void };
