local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local StarterGui = game:GetService("StarterGui")

if _G.remove_animspy then _G.remove_animspy() end

-- Configurations:
local ANIMATION_TIMINGS = {
	-- Strongest Hero
	-- Hero Hunter
	-- Destructive Cyborg
	["rbxassetid://10479335397"] = {0.365, 0.430},

	-- Deadly Ninja
	-- Brutal Demon
	-- Blade Master
	["rbxassetid://13380255751"] = {0.370, 0.520},

	-- Strongest Hero
	["rbxassetid://10469493270"] = {0.120, 0.240},
	["rbxassetid://10469630950"] = {0.050, 0.230},
	["rbxassetid://10469639222"] = {0.130, 0.250},
	["rbxassetid://10469643643"] = {0.120, 0.240},

	-- Hero Hunter
	["rbxassetid://13532562418"] = {0.120, 0.240},
	["rbxassetid://13532600125"] = {0.120, 0.240},
	["rbxassetid://13532604085"] = {0.120, 0.260},
	["rbxassetid://13294471966"] = {0.050, 0.360},

	-- Destroyer Cyborg
	["rbxassetid://13491635433"] = {0.120, 0.240},
	["rbxassetid://13296577783"] = {0.150, 0.310},
	["rbxassetid://13295919399"] = {0.150, 0.310},
	["rbxassetid://13295936866"] = {0.240, 0.260},

	-- Deadly Ninja
    ["rbxassetid://13370310513"] = {0.120, 0.250},
	["rbxassetid://13390230973"] = {0.120, 0.240},
	["rbxassetid://13378751717"] = {0.120, 0.240},
	["rbxassetid://13378708199"] = {0.120, 0.240},

	-- Brutal Demon
	["rbxassetid://14004222985"] =  {0.120, 0.380},
	["rbxassetid://13997092940"] =  {0.120, 0.380},
	["rbxassetid://14001963401"] =  {0.120, 0.380},
	["rbxassetid://14136436157"] =  {0.150, 0.420},

	-- Blade Master
	["rbxassetid://15259161390"] =  {0.120, 0.340},
	["rbxassetid://15240216931"] =  {0.120, 0.340},
	["rbxassetid://15240176873"] =  {0.120, 0.340},
	["rbxassetid://15162694192"] =  {0.150, 0.390},

}

local IGNORE_ANIMATIONS = {
	-- Movement
	["rbxassetid://14516273501"] = true, -- Idle
	["rbxassetid://7807831448"] = true, -- Walking
	["http://www.roblox.com/asset/?id=125750702"] = true, -- Jumping
	["http://www.roblox.com/asset/?id=180436148"] = true, -- Falling
	["rbxassetid://7815618175"] = true, -- Running

	-- Misc
	["rbxassetid://13379404053"] = true, -- Weapon Run
	["rbxassetid://10480793962"] = true, -- Right Dash
	["rbxassetid://10480796021"] = true, -- Left Dash


	-- Deadly Ninja
    ["rbxassetid://13377153603"] = true,
}

-- Variables
local LocalPlayer = Players.LocalPlayer
local bin = {}
local temporary_ignore = {}

local color_correction = Instance.new("ColorCorrectionEffect")
color_correction.Enabled = false
color_correction.Parent = Lighting
bin[color_correction] = color_correction

-- Functions
local function onCharacter(character)
    local humanoid = character:WaitForChild("Humanoid") :: Humanoid
    local animator = humanoid:WaitForChild("Animator") :: Animator

	bin[{}] = animator.AnimationPlayed:Connect(function(track)
        local animation = track.Animation
        local animName = animation:GetFullName()
        local animId = animation.AnimationId
        local timings = ANIMATION_TIMINGS[animId]

        if not timings and not IGNORE_ANIMATIONS[animId] and not temporary_ignore[animId] then
            local bindable = Instance.new("BindableFunction")
            StarterGui:SetCore("SendNotification", {
                Title = `Name: {animName}`,
                Text = `ID: {animId}`,
                Duration = 5,
                Button1 = "Copy ID",
                Button2 = "Ignore",
                Callback = bindable,
            })
            bindable.OnInvoke = function(button)
                if button == "Copy ID" then
                    setclipboard(animId)
                elseif button == "Ignore" then
                    IGNORE_ANIMATIONS[animId] = true
                end
                bindable:Destroy()
            end

            temporary_ignore[animId] = true
            task.delay(5, function()
                bindable:Destroy()
                temporary_ignore[animId] = nil
            end)
        end
    end)
	bin[{}] = animator.AnimationPlayed:Connect(function(track)
        local animation = track.Animation
        local animId = animation.AnimationId
        local timings = ANIMATION_TIMINGS[animId]
        if timings then
			track:AdjustSpeed(1)
            local start = timings[1]
            repeat
                task.wait()
				if not track.IsPlaying then return end
            until track.TimePosition >= start
			track:AdjustSpeed(0)
			color_correction.TintColor = Color3.fromRGB(255, 200, 200)
			color_correction.Enabled = true
			task.wait(0.1)
			track:AdjustSpeed(1)

            local finish = timings[2]
            repeat
                task.wait()
				if not track.IsPlaying then return end
            until track.TimePosition >= finish
			track:AdjustSpeed(0)
			color_correction.TintColor = Color3.fromRGB(200, 255, 200)
			task.wait(0.2)
			color_correction.Enabled = false
			if track.IsPlaying then
				track:AdjustSpeed(1)
			end
        end
    end)
end

local function cleanup(obj)
    for i,v in pairs(obj) do
        local t = typeof(v)
        if t == "RBXScriptConnection" then
            v:Disconnect()
		elseif t == "Instance" then
			v:Destroy()
        elseif t == "table" then
            cleanup(v)
        end
    end
end

_G.remove_animspy = function()
    cleanup(bin)
    bin = {}
end

-- Main
local character = LocalPlayer.Character
if  character then onCharacter(character) end
bin.characteradded = LocalPlayer.CharacterAdded:Connect(onCharacter)