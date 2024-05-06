local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local LocalPlayer = Players.LocalPlayer

local character = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
local root = character:WaitForChild("HumanoidRootPart")
local humanoid = character:WaitForChild("Humanoid")
local animator = humanoid:WaitForChild("Animator")

character:GetAttributeChangedSignal("LastDashSwing"):Connect(function()
	local s = os.clock()
	character:GetAttributeChangedSignal("LastDamageDone"):Once(function()
		local t = os.clock()
		local dt = t - s
		print(`Damage took ${dt * 1000} ms`)
	end)
end)