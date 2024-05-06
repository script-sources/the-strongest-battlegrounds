local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")


local LocalPlayer = Players.LocalPlayer

local acharacter = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
local aroot = acharacter:WaitForChild("HumanoidRootPart")

local combo = 1
acharacter:GetAttributeChangedSignal("LastM1Fire"):Connect(function()
	warn(combo - 1)
	local t = tick()
	local c =acharacter:GetAttributeChangedSignal("LastDamageDone"):Once(function()
		print((tick() - t) * 1000)
	end)
	task.wait(0.5)
	c:Disconnect()
end)
acharacter:GetAttributeChangedSignal("Combo"):Connect(function()
	local currentCombo = acharacter:GetAttribute("Combo")
	combo = currentCombo
end)

acharacter:GetAttributeChangedSignal("LastDashSwing"):Connect(function()
	local t = tick()
	local c =acharacter:GetAttributeChangedSignal("LastDamageDone"):Once(function()
		print((tick() - t) * 1000)
	end)
	task.wait(2)
	c:Disconnect()
end)


local plr = game.Players.LocalPlayer
plr:GetAttributeChangedSignal("Character"):Once(function()
	print("Character changed")
end)
plr.CharacterAdded:Once(function()
	print("Character added")
end)


