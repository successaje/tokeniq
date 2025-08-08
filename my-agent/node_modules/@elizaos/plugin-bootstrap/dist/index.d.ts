import { Action, Evaluator, Provider, Plugin, Media, IAgentRuntime, Room } from '@elizaos/core';

/**
 * Represents an action that allows selecting an option for a pending task that has multiple options.
 * @type {Action}
 * @property {string} name - The name of the action
 * @property {string[]} similes - Similar words or phrases for the action
 * @property {string} description - A brief description of the action
 * @property {Function} validate - Asynchronous function to validate the action
 * @property {Function} handler - Asynchronous function to handle the action
 * @property {ActionExample[][]} examples - Examples demonstrating the usage of the action
 */
declare const choiceAction: Action;

/**
 * Action for following a room with great interest.
 * Similes: FOLLOW_CHAT, FOLLOW_CHANNEL, FOLLOW_CONVERSATION, FOLLOW_THREAD
 * Description: Start following this channel with great interest, chiming in without needing to be explicitly mentioned. Only do this if explicitly asked to.
 * @param {IAgentRuntime} runtime - The current agent runtime.
 * @param {Memory} message - The message memory.
 * @returns {Promise<boolean>} - Promise that resolves to a boolean indicating if the room should be followed.
 */
declare const followRoomAction: Action;

/**
 * Action representing the IGNORE action. This action is used when ignoring the user in a conversation.
 *
 * @type {Action}
 * @property {string} name - The name of the action, which is "IGNORE".
 * @property {string[]} similes - An array of related similes for the action.
 * @property {Function} validate - Asynchronous function that validates the action.
 * @property {string} description - Description of when to use the IGNORE action in a conversation.
 * @property {Function} handler - Asynchronous function that handles the action logic.
 * @property {ActionExample[][]} examples - Array of examples demonstrating the usage of the IGNORE action.
 */
/**
 * Represents an action called 'IGNORE'.
 *
 * This action is used to ignore the user in a conversation. It should be used when the user is aggressive, creepy, or when the conversation has naturally ended.
 * Avoid using this action if the user has engaged directly or if there is a need to communicate with them. Use IGNORE only when the user should be ignored.
 *
 * The action includes a validation function that always returns true and a handler function that also returns true.
 *
 * Examples of using the IGNORE action are provided in the 'examples' array. Each example includes messages between two parties and the use of the IGNORE action.
 *
 * @typedef {Action} ignoreAction
 */
declare const ignoreAction: Action;

/**
 * Action for muting a room, ignoring all messages unless explicitly mentioned.
 * Only do this if explicitly asked to, or if you're annoying people.
 *
 * @name MUTE_ROOM
 * @type {Action}
 *
 * @property {string} name - The name of the action
 * @property {string[]} similes - Similar actions related to muting a room
 * @property {string} description - Description of the action
 * @property {Function} validate - Validation function to check if the room is not already muted
 * @property {Function} handler - Handler function to handle muting the room
 * @property {ActionExample[][]} examples - Examples of using the action
 */
declare const muteRoomAction: Action;

/**
 * Represents the none action.
 *
 * This action responds but performs no additional action. It is the default if the agent is speaking and not doing anything additional.
 *
 * @type {Action}
 */
/**
 * Represents an action that responds but performs no additional action.
 * This is the default behavior if the agent is speaking and not doing anything additional.
 * @type {Action}
 */
declare const noneAction: Action;

/**
 * Represents an action that allows the agent to reply to the current conversation with a generated message.
 *
 * This action can be used as an acknowledgement at the beginning of a chain of actions, or as a final response at the end of a chain of actions.
 *
 * @typedef {Object} replyAction
 * @property {string} name - The name of the action ("REPLY").
 * @property {string[]} similes - An array of similes for the action.
 * @property {string} description - A description of the action and its usage.
 * @property {Function} validate - An asynchronous function for validating the action runtime.
 * @property {Function} handler - An asynchronous function for handling the action logic.
 * @property {ActionExample[][]} examples - An array of example scenarios for the action.
 */
declare const replyAction: Action;

/**
 * Represents an action to update the role of a user within a server.
 * @typedef {Object} Action
 * @property {string} name - The name of the action.
 * @property {string[]} similes - The similar actions that can be performed.
 * @property {string} description - A description of the action and its purpose.
 * @property {Function} validate - A function to validate the action before execution.
 * @property {Function} handler - A function to handle the execution of the action.
 * @property {ActionExample[][]} examples - Examples demonstrating how the action can be used.
 */
declare const updateRoleAction: Action;

/**
 * Represents an action to send a message to a user or room.
 *
 * @typedef {Action} sendMessageAction
 * @property {string} name - The name of the action.
 * @property {string[]} similes - Additional names for the action.
 * @property {string} description - Description of the action.
 * @property {function} validate - Asynchronous function to validate if the action can be executed.
 * @property {function} handler - Asynchronous function to handle the action execution.
 * @property {ActionExample[][]} examples - Examples demonstrating the usage of the action.
 */
declare const sendMessageAction: Action;

/**
 * Enhanced settings action with improved state management and logging
 * Updated to use world metadata instead of cache
 */
declare const updateSettingsAction: Action;

/**
 * Action for unfollowing a room.
 *
 * - Name: UNFOLLOW_ROOM
 * - Similes: ["UNFOLLOW_CHAT", "UNFOLLOW_CONVERSATION", "UNFOLLOW_ROOM", "UNFOLLOW_THREAD"]
 * - Description: Stop following this channel. You can still respond if explicitly mentioned, but you won't automatically chime in anymore. Unfollow if you're annoying people or have been asked to.
 * - Validate function checks if the room state is "FOLLOWED".
 * - Handler function handles the unfollowing logic based on user input.
 * - Examples provide sample interactions for unfollowing a room.
 */
declare const unfollowRoomAction: Action;

/**
 * Action to unmute a room, allowing the agent to consider responding to messages again.
 *
 * @name UNMUTE_ROOM
 * @similes ["UNMUTE_CHAT", "UNMUTE_CONVERSATION", "UNMUTE_ROOM", "UNMUTE_THREAD"]
 * @description Unmutes a room, allowing the agent to consider responding to messages again.
 *
 * @param {IAgentRuntime} runtime - The agent runtime to access runtime functionalities.
 * @param {Memory} message - The message containing information about the room.
 * @returns {Promise<boolean>} A boolean value indicating if the room was successfully unmuted.
 */
declare const unmuteRoomAction: Action;

/**
 * Action for updating contact details for a user entity.
 *
 * @name UPDATE_ENTITY
 * @description Add or edit contact details for a user entity (like twitter, discord, email address, etc.)
 *
 * @param {IAgentRuntime} _runtime - The runtime environment.
 * @param {Memory} _message - The message data.
 * @param {State} _state - The current state.
 * @returns {Promise<boolean>} Returns a promise indicating if validation was successful.
 *
 * @param {IAgentRuntime} runtime - The runtime environment.
 * @param {Memory} message - The message data.
 * @param {State} state - The current state.
 * @param {any} _options - Additional options.
 * @param {HandlerCallback} callback - The callback function.
 * @param {Memory[]} responses - Array of responses.
 * @returns {Promise<void>} Promise that resolves after handling the update entity action.
 *
 * @example
 * [
 *    [
 *      {
 *        name: "{{name1}}",
 *        content: {
 *          text: "Please update my telegram username to @dev_guru",
 *        },
 *      },
 *      {
 *        name: "{{name2}}",
 *        content: {
 *          text: "I've updated your telegram information.",
 *          actions: ["UPDATE_ENTITY"],
 *        },
 *      },
 *    ],
 *    ...
 * ]
 */
declare const updateEntityAction: Action;

declare const reflectionEvaluator: Evaluator;

/**
 * A provider object that fetches possible response actions based on the provided runtime, message, and state.
 * @type {Provider}
 * @property {string} name - The name of the provider ("ACTIONS").
 * @property {string} description - The description of the provider ("Possible response actions").
 * @property {number} position - The position of the provider (-1).
 * @property {Function} get - Asynchronous function that retrieves actions that validate for the given message.
 * @param {IAgentRuntime} runtime - The runtime object.
 * @param {Memory} message - The message memory.
 * @param {State} state - The state object.
 * @returns {Object} An object containing the actions data, values, and combined text sections.
 */
/**
 * Provider for ACTIONS
 *
 * @typedef {import('./Provider').Provider} Provider
 * @typedef {import('./Runtime').IAgentRuntime} IAgentRuntime
 * @typedef {import('./Memory').Memory} Memory
 * @typedef {import('./State').State} State
 * @typedef {import('./Action').Action} Action
 *
 * @type {Provider}
 * @property {string} name - The name of the provider
 * @property {string} description - Description of the provider
 * @property {number} position - The position of the provider
 * @property {Function} get - Asynchronous function to get actions that validate for a given message
 *
 * @param {IAgentRuntime} runtime - The agent runtime
 * @param {Memory} message - The message memory
 * @param {State} state - The state of the agent
 * @returns {Object} Object containing data, values, and text related to actions
 */
declare const actionsProvider: Provider;

/**
 * Represents an anxiety provider that provides examples and guidance for an AI roleplaying as a character.
 * The anxiety provider offers suggestions on how to reduce verbosity and eagerness in responses based on the channel type.
 * Randomly selects and returns three anxiety examples for the AI to follow.
 *
 * @type {Provider}
 */
/**
 * Function that provides anxiety-related guidance for the AI based on the channel type.
 * @param {IAgentRuntime} _runtime - The runtime environment for the AI agent
 * @param {Memory} message - The message containing information about the channel type
 * @returns {Object} - Object containing randomized anxiety examples, anxiety text, and formatted data
 */
declare const anxietyProvider: Provider;

/**
 * Provides a list of attachments in the current conversation.
 * @param {IAgentRuntime} runtime - The agent runtime object.
 * @param {Memory} message - The message memory object.
 * @returns {Object} The attachments values, data, and text.
 */
/**
 * Provides a list of attachments sent during the current conversation, including names, descriptions, and summaries.
 * @type {Provider}
 * @property {string} name - The name of the provider (ATTACHMENTS).
 * @property {string} description - Description of the provider.
 * @property {boolean} dynamic - Indicates if the provider is dynamic.
 * @property {function} get - Asynchronous function that retrieves attachments based on the runtime and message provided.
 * @param {IAgentRuntime} runtime - The runtime environment for the agent.
 * @param {Memory} message - The message object containing content and attachments.
 * @returns {Object} An object containing values, data, and text about the attachments retrieved.
 */
declare const attachmentsProvider: Provider;

/**
 * Provider that collects capability descriptions from all registered services
 */
/**
 * Provides capabilities information for the agent.
 *
 * @param {IAgentRuntime} runtime - The agent runtime instance.
 * @param {Memory} _message - The memory message object.
 * @returns {Promise<ProviderResult>} The provider result object containing capabilities information.
 */
declare const capabilitiesProvider: Provider;

/**
 * Character provider object.
 * @typedef {Object} Provider
 * @property {string} name - The name of the provider ("CHARACTER").
 * @property {string} description - Description of the character information.
 * @property {Function} get - Async function to get character information.
 */
/**
 * Provides character information.
 * @param {IAgentRuntime} runtime - The agent runtime.
 * @param {Memory} message - The message memory.
 * @param {State} state - The state of the character.
 * @returns {Object} Object containing values, data, and text sections.
 */
declare const characterProvider: Provider;

/**
 * Choice provider function that retrieves all pending tasks with options for a specific room
 *
 * @param {IAgentRuntime} runtime - The runtime object for the agent
 * @param {Memory} message - The message memory object
 * @returns {Promise<ProviderResult>} A promise that resolves with the provider result containing the pending tasks with options
 */
declare const choiceProvider: Provider;

/**
 * Provider for fetching entities related to the current conversation.
 * @type { Provider }
 */
declare const entitiesProvider: Provider;

declare const evaluatorsProvider: Provider;

/**
 * Function to get key facts that the agent knows.
 * @param {IAgentRuntime} runtime - The runtime environment for the agent.
 * @param {Memory} message - The message object containing relevant information.
 * @param {State} [_state] - Optional state information.
 * @returns {Object} An object containing values, data, and text related to the key facts.
 */
declare const factsProvider: Provider;

/**
 * Provider for retrieving list of all data providers available for the agent to use.
 * @type { Provider }
 */
/**
 * Object representing the providersProvider, which contains information about data providers available for the agent.
 *
 * @type {Provider}
 * @property {string} name - The name of the provider ("PROVIDERS").
 * @property {string} description - Description of the provider.
 * @property {Function} get - Async function that filters dynamic providers, creates formatted text for each provider, and provides data for potential use.
 * @param {IAgentRuntime} runtime - The runtime of the agent.
 * @param {Memory} _message - The memory message.
 * @returns {Object} An object containing the formatted text and data for potential programmatic use.
 */
declare const providersProvider: Provider;

/**
 * A provider object that retrieves recent messages, interactions, and memories based on a given message.
 * @typedef {object} Provider
 * @property {string} name - The name of the provider ("RECENT_MESSAGES").
 * @property {string} description - A description of the provider's purpose ("Recent messages, interactions and other memories").
 * @property {number} position - The position of the provider (100).
 * @property {Function} get - Asynchronous function that retrieves recent messages, interactions, and memories.
 * @param {IAgentRuntime} runtime - The runtime context for the agent.
 * @param {Memory} message - The message to retrieve data from.
 * @returns {object} An object containing data, values, and text sections.
 */
declare const recentMessagesProvider: Provider;

/**
 * Provider for fetching relationships data.
 *
 * @type {Provider}
 * @property {string} name - The name of the provider ("RELATIONSHIPS").
 * @property {string} description - Description of the provider.
 * @property {Function} get - Asynchronous function to fetch relationships data.
 * @param {IAgentRuntime} runtime - The agent runtime object.
 * @param {Memory} message - The message object containing entity ID.
 * @returns {Promise<Object>} Object containing relationships data or error message.
 */
declare const relationshipsProvider: Provider;

/**
 * Role provider that retrieves roles in the server based on the provided runtime, message, and state.
 * * @type { Provider }
 * @property { string } name - The name of the role provider.
 * @property { string } description - A brief description of the role provider.
 * @property { Function } get - Asynchronous function that retrieves and processes roles in the server.
 * @param { IAgentRuntime } runtime - The agent runtime object.
 * @param { Memory } message - The message memory object.
 * @param { State } state - The state object.
 * @returns {Promise<ProviderResult>} The result containing roles data, values, and text.
 */
/**
 * A provider for retrieving and formatting the role hierarchy in a server.
 * @type {Provider}
 */
declare const roleProvider: Provider;

/**
 * Creates an settings provider with the given configuration
 * Updated to use world metadata instead of cache
 */
declare const settingsProvider: Provider;

/**
 * Time provider function that retrieves the current date and time in UTC
 * for use in time-based operations or responses.
 *
 * @param _runtime - The runtime environment of the bot agent.
 * @param _message - The memory object containing message data.
 * @returns An object containing the current date and time data, human-readable date and time string,
 * and a text response with the current date and time information.
 */
/**
 * Represents a time provider for retrieving current date and time information.
 * @type {Provider}
 */
declare const timeProvider: Provider;

/**
 * Provider that exposes relevant world/environment information to agents.
 * Includes details like channel list, world name, and other world metadata.
 */
declare const worldProvider: Provider;

/**
 * Represents media data containing a buffer of data and the media type.
 * @typedef {Object} MediaData
 * @property {Buffer} data - The buffer of data.
 * @property {string} mediaType - The type of media.
 */
type MediaData = {
    data: Buffer;
    mediaType: string;
};
/**
 * Escapes special characters in a string to make it JSON-safe.
 */
/**
 * Fetches media data from a list of attachments, supporting both HTTP URLs and local file paths.
 *
 * @param attachments Array of Media objects containing URLs or file paths to fetch media from
 * @returns Promise that resolves with an array of MediaData objects containing the fetched media data and content type
 */
/**
 * Fetches media data from given attachments.
 * @param {Media[]} attachments - Array of Media objects to fetch data from.
 * @returns {Promise<MediaData[]>} - A Promise that resolves with an array of MediaData objects.
 */
declare function fetchMediaData(attachments: Media[]): Promise<MediaData[]>;
/**
 * Processes attachments by generating descriptions for supported media types.
 * Currently supports image description generation.
 *
 * @param {Media[]} attachments - Array of attachments to process
 * @param {IAgentRuntime} runtime - The agent runtime for accessing AI models
 * @returns {Promise<Media[]>} - Returns a new array of processed attachments with added description, title, and text properties
 */
declare function processAttachments(attachments: Media[], runtime: IAgentRuntime): Promise<Media[]>;
/**
 * Determines whether to skip the shouldRespond logic based on room type and message source.
 * Supports both default values and runtime-configurable overrides via env settings.
 */
declare function shouldBypassShouldRespond(runtime: IAgentRuntime, room?: Room, source?: string): boolean;
declare const bootstrapPlugin: Plugin;

export { actionsProvider, anxietyProvider, attachmentsProvider, bootstrapPlugin, capabilitiesProvider, characterProvider, choiceAction, choiceProvider, bootstrapPlugin as default, entitiesProvider, evaluatorsProvider, factsProvider, fetchMediaData, followRoomAction, ignoreAction, muteRoomAction, noneAction, processAttachments, providersProvider, recentMessagesProvider, reflectionEvaluator, relationshipsProvider, replyAction, roleProvider, sendMessageAction, settingsProvider, shouldBypassShouldRespond, timeProvider, unfollowRoomAction, unmuteRoomAction, updateEntityAction, updateRoleAction, updateSettingsAction, worldProvider };
