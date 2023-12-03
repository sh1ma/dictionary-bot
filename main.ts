import {
  createApplicationCommand,
  createBot,
  Intents,
  InteractionResponseTypes,
  startBot,
} from "https://deno.land/x/discordeno@13.0.0/mod.ts"

const TOKEN = Deno.env.get("TOKEN")
if (TOKEN === undefined) {
  throw new Error("No token provided")
}

const API_URL = Deno.env.get("API_URL")

if (API_URL === undefined) {
  throw new Error("No API_URL provided")
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const bot = createBot({
    token: TOKEN,
    intents: Intents.Guilds | Intents.GuildMessages | Intents.MessageContent,
    events: {
      ready() {
        console.log("Successfully connected to gateway")
      },
      async messageCreate(bot, message) {
        if (message.isFromBot) {
          return
        }
        console.debug(
          JSON.stringify({
            key: message.content,
          })
        )
        const response = await fetch(`${API_URL}/dict/get`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: message.content,
          }),
        })
        if (response.status !== 200) {
          // not found
          return
        }
        const json = await response.json()
        if (json === null || json.value === null) {
          return
        }

        await bot.helpers.sendMessage(message.channelId, {
          content: json.value,
        })
      },

      async interactionCreate(bot, interaction) {
        if (interaction.data?.name === "register") {
          const word = interaction.data.options?.[0].value
          const meaning = interaction.data.options?.[1].value

          if (word === undefined || meaning === undefined) {
            return
          }

          const response = await fetch(`${API_URL}/dict/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key: word,
              value: meaning,
            }),
          })
          if (response.status !== 200) {
            console.error("Failed to register word")
            await bot.helpers.sendInteractionResponse(
              interaction.id,
              interaction.token,
              {
                type: InteractionResponseTypes.ChannelMessageWithSource,
                data: {
                  content: "ちょっと何言ってるかわかんないですｗ",
                },
              }
            )
          } else {
            console.log(`Successfully registered word: ${word} ${meaning}`)
          }
          await bot.helpers.sendInteractionResponse(
            interaction.id,
            interaction.token,
            {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                content: `「${word}」は「${meaning}」なんですね！覚えました！`,
              },
            }
          )
        }
      },
    },
  })

  createApplicationCommand(bot, {
    name: "register",
    description: "辞書に登録します",
    options: [
      {
        name: "word",
        description: "登録する単語",
        type: 3,
        required: true,
      },
      {
        name: "meaning",
        description: "単語の意味",
        type: 3,
        required: true,
      },
    ],
  })

  await startBot(bot)
}
