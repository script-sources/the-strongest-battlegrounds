local ReplicatedStorage = game:GetService("ReplicatedStorage")

local formatValue
local formatArrayValues
local formatDictionaryValues
do
	formatValue = function(value)
		local t = typeof(value)
		if t == "string" then
			return "\"" .. value .. "\""
		elseif t == "Instance" then
			return `{value:GetFullName()} [{value.ClassName}]`
		elseif t == "table" then
			local numeric = #value
			local keys = 0
			for _,_ in value do keys += 1 end
			if keys == numeric then
				return formatArrayValues(value)
			else
				return formatDictionaryValues(value)
			end
		end
	end

	formatArrayValues = function(array)
		local str = "["
		for i = 1, #array do
			local value = array[i]
			str ..= formatValue(value)
			if i < #array then
				str ..= ", "
			end
		end
		str = str .. "]"
		return str
	end

	formatDictionaryValues = function(dictionary)
		local str = "{"
		for i,v in pairs(dictionary) do
			local key, value = formatValue(i), formatValue(v)
			str ..= key .. " = " .. value .. ", "
		end
		str = str:sub(1, #str - 2) .. "}"
		return str
	end
end

local onRemoteEvent = function(event)
	local name = event.Name
	local parent = event
	repeat
		parent = parent.Parent
		name = parent.Name .. "." .. name
	until parent == ReplicatedStorage or parent == game or parent == nil

	event.OnClientEvent:Connect(function(...)
		local args = {...}
		warn("RemoteEvent: " .. name)
		print("Arguments: " .. formatArrayValues(args))
	end)
end

local blacklist_names = {}
for i,v in ReplicatedStorage:GetDescendants() do
	if blacklist_names[v.Name] then continue end
	if v:IsA("RemoteEvent") then
		onRemoteEvent(v)
	end
end