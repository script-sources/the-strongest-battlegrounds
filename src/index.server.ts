import { Players, RunService, UserInputService } from "@rbxts/services";
import { Destructible, Node } from "types";

if (_G["tsb-script"]) throw "This program is already running!";
_G["tsb-script"] = true;

/************************************************************
 * CONFIGURATIONS
 * Description: User-defined settings and configurations
 * Last updated: Feb. 14, 2024
 ************************************************************/
const SWING_DASHES = {
	// Deadly Ninja
	// Brutal Demon
	// Blade Master
	WEAPON: "rbxassetid://13380255751",

	// Strongest Hero
	// Hero Hunter
	// Destructive Cyborg
	FISTS: "rbxassetid://10479335397",
};

const BALD_COMBO_TIMINGS = [0.25, 0.25, 0.25, 0.25];
const HUNTER_COMBO_TIMINGS = [0.24, 0.24, 0.26, 0.36];
const CYBORG_COMBO_TIMINGS = [0.24, 0.3, 0.3, 0.33];
const NINJA_COMBO_TIMINGS = [0.24, 0.24, 0.24, 0.24];
const BATTER_COMBO_TIMINGS = [0.31, 0.31, 0.31, 0.33];
const BLADE_COMBO_TIMINGS = [0.34, 0.34, 0.34, 0.39];

/************************************************************
 * VARIABLES
 * Description: Variables referenced globally in the script
 * Last updated: Feb. 14, 2024
 ************************************************************/
const LocalPlayer = Players.LocalPlayer;

const XZ = new Vector3(1, 0, 1);

/************************************************************
 * UTILITIES
 * Description: Helper functions and classes
 * Last updated: Feb. 14, 2024
 ************************************************************/
class Bin {
	private head: Node | undefined;
	private tail: Node | undefined;

	/**
	 * Adds an item into the Bin. This can be a:
	 * - `() => unknown`
	 * - RBXScriptConnection
	 * - thread
	 * - Object with `.destroy()` or `.Destroy()`
	 */
	public add<T extends Destructible>(item: T): T {
		const node: Node = { item };
		this.head ??= node;
		if (this.tail) this.tail.next = node;
		this.tail = node;
		return item;
	}

	/**
	 * Adds multiple items into the Bin. This can be a:
	 * - `() => unknown`
	 * - RBXScriptConnection
	 * - thread
	 * - Object with `.destroy()` or `.Destroy()`
	 */
	public batch<T extends Destructible[]>(...args: T): T {
		for (const item of args) {
			const node: Node = { item };
			this.head ??= node;
			if (this.tail) this.tail.next = node;
			this.tail = node;
		}
		return args;
	}

	/**
	 * Destroys all items currently in the Bin:
	 * - Functions will be called
	 * - RBXScriptConnections will be disconnected
	 * - threads will be `task.cancel()`-ed
	 * - Objects will be `.destroy()`-ed
	 */
	public destroy(): void {
		while (this.head) {
			const item = this.head.item;
			if (typeIs(item, "function")) {
				item();
			} else if (typeIs(item, "RBXScriptConnection")) {
				item.Disconnect();
			} else if (typeIs(item, "thread")) {
				task.cancel(item);
			} else if ("destroy" in item) {
				item.destroy();
			} else if ("Destroy" in item) {
				item.Destroy();
			}
			this.head = this.head.next;
		}
	}

	/**
	 * Checks whether the Bin is empty.
	 */
	public isEmpty(): boolean {
		return this.head === undefined;
	}
}

/************************************************************
 * COMPONENTS
 * Description: Classes for specific entities/objects
 * Last updated: Feb. 14, 2024
 ************************************************************/
class BaseComponent<T extends Instance> {
	protected bin = new Bin();

	constructor(readonly instance: T) {}

	/**
	 * Terminates the component and all functionality.
	 */
	public destroy(): void {
		this.bin.destroy();
	}
}

class RigComponent extends BaseComponent<Model> {
	public readonly root: BasePart;
	public readonly humanoid: Humanoid;
	public readonly animator: Animator | undefined;

	constructor(instance: Model) {
		super(instance);

		const root = instance.WaitForChild("HumanoidRootPart", 4) as BasePart | undefined;
		if (root === undefined) throw `HumanoidRootPart not found for ${instance.GetFullName()}`;
		const humanoid = instance.WaitForChild("Humanoid", 4) as Humanoid | undefined;
		if (humanoid === undefined) throw `Humanoid not found for ${instance.GetFullName()}`;
		const animator = instance.WaitForChild("Animator", 10) as Animator | undefined;
		if (animator === undefined) warn(`Animator not found for ${instance.GetFullName()}`);

		this.root = root;
		this.humanoid = humanoid;
		this.animator = animator;

		const bin = this.bin;
		bin.batch(
			humanoid.Died.Connect(() => this.destroy()),
			instance.Destroying.Connect(() => this.destroy()),
		);
	}
}

class CombatantComponent extends RigComponent {
	protected combo = 0;

	constructor(instance: Model) {
		super(instance);
		this.onComboChanged();
		const bin = this.bin;
		bin.batch(
			instance.GetAttributeChangedSignal("Combo").Connect(() => this.onComboChanged()),
			instance.GetAttributeChangedSignal("LastM1Fire").Connect(() => this.onNormalAttack()),
		);
		const animConnection = this.animator?.AnimationPlayed.Connect((animTrack) => this.onAnimationPlayed(animTrack));
		if (animConnection) bin.add(animConnection);
	}

	private onComboChanged() {
		const current = this.instance.GetAttribute("Combo") as number | undefined;
		if (current !== undefined) this.combo = current - 2;
	}

	protected onNormalAttack() {
		const origin = AgentController.root.Position;
		const position = this.root.Position;
		const distance = position.sub(origin).mul(XZ).Magnitude;
		if (distance < 12) CounterController.block(this, 0.27);
	}

	protected onDashAttack() {
		const { bin, root } = this;
		let inRange = false;
		const connection = RunService.Heartbeat.Connect(() => {
			const origin = AgentController.root.Position;
			const position = root.Position;
			const distance = position.sub(origin).mul(XZ).Magnitude;
			const inRangeNow = distance < 14;
			if (inRange !== inRangeNow) {
				if (inRange) CounterController.addBlock(this);
				else CounterController.removeBlock(this);
			}
			inRange = inRangeNow;
		});
		bin.add(connection);
	}

	protected onAnimationPlayed(track: AnimationTrack) {}
}

class BaldCombatantComponent extends CombatantComponent {
	constructor(instance: Model) {
		super(instance);
	}

	protected onNormalAttack(): void {
		const origin = AgentController.root.Position;
		const position = this.root.Position;
		const distance = position.sub(origin).mul(XZ).Magnitude;
		if (distance < 12) {
			CounterController.block(this, BALD_COMBO_TIMINGS[this.combo]);
		}
	}

	protected onAnimationPlayed(track: AnimationTrack): void {
		const animation = track.Animation;
		if (!animation) return;
		const animationId = animation.AnimationId;
		if (animationId === SWING_DASHES.FISTS) {
			this.onDashAttack();
		}
	}
}

class HunterCombatantComponent extends CombatantComponent {
	constructor(instance: Model) {
		super(instance);
	}

	protected onNormalAttack(): void {
		const origin = AgentController.root.Position;
		const position = this.root.Position;
		const distance = position.sub(origin).mul(XZ).Magnitude;
		if (distance < 12) {
			CounterController.block(this, HUNTER_COMBO_TIMINGS[this.combo]);
		}
	}

	protected onAnimationPlayed(track: AnimationTrack): void {
		const animation = track.Animation;
		if (!animation) return;
		const animationId = animation.AnimationId;
		if (animationId === SWING_DASHES.FISTS) {
			this.onDashAttack();
		}
	}
}

class CyborgCombatantComponent extends CombatantComponent {
	constructor(instance: Model) {
		super(instance);
	}

	protected onNormalAttack(): void {
		const origin = AgentController.root.Position;
		const position = this.root.Position;
		const distance = position.sub(origin).mul(XZ).Magnitude;
		if (distance < 12) {
			CounterController.block(this, CYBORG_COMBO_TIMINGS[this.combo]);
		}
	}

	protected onAnimationPlayed(track: AnimationTrack): void {
		const animation = track.Animation;
		if (!animation) return;
		const animationId = animation.AnimationId;
		if (animationId === SWING_DASHES.FISTS) {
			this.onDashAttack();
		}
	}
}

class NinjaCombatantComponent extends CombatantComponent {
	constructor(instance: Model) {
		super(instance);
	}

	protected onNormalAttack(): void {
		const origin = AgentController.root.Position;
		const position = this.root.Position;
		const distance = position.sub(origin).mul(XZ).Magnitude;
		if (distance < 12) {
			CounterController.block(this, NINJA_COMBO_TIMINGS[this.combo]);
		}
	}

	protected onAnimationPlayed(track: AnimationTrack): void {
		const animation = track.Animation;
		if (!animation) return;
		const animationId = animation.AnimationId;
		if (animationId === SWING_DASHES.WEAPON) {
			this.onDashAttack();
		}
	}
}

class BatterCombatantComponent extends CombatantComponent {
	constructor(instance: Model) {
		super(instance);
	}

	protected onNormalAttack(): void {
		const origin = AgentController.root.Position;
		const position = this.root.Position;
		const distance = position.sub(origin).mul(XZ).Magnitude;
		if (distance < 12) {
			CounterController.block(this, BATTER_COMBO_TIMINGS[this.combo]);
		}
	}

	protected onAnimationPlayed(track: AnimationTrack): void {
		const animation = track.Animation;
		if (!animation) return;
		const animationId = animation.AnimationId;
		if (animationId === SWING_DASHES.WEAPON) {
			this.onDashAttack();
		}
	}
}

class BladeCombatantComponent extends CombatantComponent {
	constructor(instance: Model) {
		super(instance);
	}

	protected onNormalAttack(): void {
		const origin = AgentController.root.Position;
		const position = this.root.Position;
		const distance = position.sub(origin).mul(XZ).Magnitude;
		if (distance < 12) {
			CounterController.block(this, BLADE_COMBO_TIMINGS[this.combo]);
		}
	}

	protected onAnimationPlayed(track: AnimationTrack): void {
		const animation = track.Animation;
		if (!animation) return;
		const animationId = animation.AnimationId;
		if (animationId === SWING_DASHES.WEAPON) {
			this.onDashAttack();
		}
	}
}

class PlayerComponent extends BaseComponent<Player> {
	public static active = new Map<Player, PlayerComponent>();

	public character?: CombatantComponent;
	private characterType: CharacterType = "Bald";

	constructor(instance: Player) {
		super(instance);

		this.onCharacterType();
		const character = instance.Character;
		if (character) task.defer(() => this.onCharacterAdded(character));

		const bin = this.bin;
		bin.batch(
			instance.CharacterRemoving.Connect(() => this.onCharacterRemoving()),
			instance.CharacterAdded.Connect((character) => this.onCharacterAdded(character)),
			instance.GetAttributeChangedSignal("Character").Connect(() => this.onCharacterType()),
		);
		bin.add(() => PlayerComponent.active.delete(instance));
		PlayerComponent.active.set(instance, this);
	}

	private onCharacterType() {
		const instance = this.instance;
		const attribute = instance.GetAttribute("Character") as CharacterType | undefined;
		this.characterType = attribute ?? this.characterType;
	}

	protected onCharacterAdded(character: Model) {
		this.character?.destroy();
		const { characterType } = this;
		switch (characterType) {
			case "Bald":
				this.character = new BaldCombatantComponent(character);
				break;
			case "Hunter":
				this.character = new HunterCombatantComponent(character);
				break;
			case "Cyborg":
				this.character = new CyborgCombatantComponent(character);
				break;
			case "Ninja":
				this.character = new NinjaCombatantComponent(character);
				break;
			case "Batter":
				this.character = new BatterCombatantComponent(character);
				break;
			case "Blade":
				this.character = new BladeCombatantComponent(character);
				break;
			default:
				this.character = new CombatantComponent(character);
				break;
		}
	}

	protected onCharacterRemoving() {
		this.character?.destroy();
		this.character = undefined;
	}
}

/************************************************************
 * CONTROLLERS
 * Description: Singletons that are used once
 * Last updated: Feb. 14, 2024
 ************************************************************/
namespace AgentController {
	export let agent: RigComponent | undefined;
	export let instance: Model;
	export let humanoid: Humanoid;
	export let root: BasePart;

	const onCharacterAdded = (character: Model) => {
		agent = new RigComponent(character);
		instance = character;
		root = agent.root;
		humanoid = agent.humanoid;
	};

	const onCharacterRemoving = () => {
		agent?.destroy();
		agent = undefined;
	};

	export function __init() {
		const character = LocalPlayer.Character;
		if (character) task.defer(() => onCharacterAdded(character));
		LocalPlayer.CharacterAdded.Connect(onCharacterAdded);
		LocalPlayer.CharacterRemoving.Connect(onCharacterRemoving);
	}
}

namespace CounterController {
	let block_enabled = false;
	let counter_enabled = false;

	let blocking = false;
	const blockables = new Set<CombatantComponent>();

	export function addBlock(component: CombatantComponent) {
		if (!blocking && block_enabled) {
			keypress(0x46);
			blocking = true;
		}
		blockables.add(component);
	}

	export function removeBlock(component: CombatantComponent) {
		blockables.delete(component);
		if (block_enabled && blockables.size() === 0) {
			keyrelease(0x46);
			blocking = false;
		}
	}

	export function block(component: CombatantComponent, length: number): void {
		addBlock(component);
		task.delay(length, () => removeBlock(component));
	}

	export function counter() {
		if (!counter_enabled) return;
		keypress(0x46);
		task.delay(0.1, () => keyrelease(0x46));
	}

	export function setBlockEnabled(value: boolean) {
		block_enabled = value;
	}

	export function setCounterEnabled(value: boolean) {
		counter_enabled = value;
	}

	export function __init() {
		UserInputService.InputBegan.Connect((input, gameProcessedEvent) => {
			if (gameProcessedEvent) return;
			if (input.KeyCode === Enum.KeyCode.KeypadOne) {
				setBlockEnabled(true);
				setCounterEnabled(true);
			}
		});

		UserInputService.InputEnded.Connect((input) => {
			if (input.KeyCode === Enum.KeyCode.KeypadOne) {
				setBlockEnabled(false);
				setCounterEnabled(false);
			}
		});
	}
}

namespace ComponentController {
	const onPlayerAdded = (player: Player) => new PlayerComponent(player);
	const onPlayerRemoving = (player: Player) => PlayerComponent.active.get(player)?.destroy();

	export function __init() {
		for (const player of Players.GetPlayers()) if (player !== LocalPlayer) task.defer(onPlayerAdded, player);
		Players.PlayerAdded.Connect(onPlayerAdded);
		Players.PlayerRemoving.Connect(onPlayerRemoving);
	}
}

/************************************************************
 * INITIALIZATION
 * Description: Initializes and starts the runtime
 * Last updated: Feb. 14, 2024
 ************************************************************/
AgentController.__init();
CounterController.__init();
ComponentController.__init();

export = "Initialized Successfully";
