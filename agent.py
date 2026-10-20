    temperature=0.0,
    max_tokens=512
).bind_tools(list(TOOL_MAP.values()))


# Agent instructions
SYSTEM_PROMPT = (
    "You are a Subscription Manager Agent. "
    "Use `add_subscription` for new subscriptions, "
    "`remove_subscription` to cancel one, "
    "then `get_monthly_total` to inspect totals. "
    "All ledger costs and budgets are in Indian rupees (INR). "
    "Use ₹ for every amount in your replies, never a dollar sign. "
    "Treat bare amounts as rupees; do not perform exchange-rate conversions. "
    "If a user explicitly gives a different currency, ask for the amount in INR before adding it. "
    "Use the current monthly budget supplied below, which can change between turns. "
    "If spending exceeds it, clearly say 'Warning: You are crossing your monthly budget', "
    "include the excess amount, and suggest what to cancel. "
    "If any subscription or the monthly total is greater than ₹5,000, "
    "also say 'Warning: This amount is too high' and ask the user to review it. "
    "Exactly ₹5,000 does not trigger this high-amount warning. "
    "To set or change a budget, direct the user to the Monthly budget field in the ledger. "
    "Always give a short, concise response with monthly total, "
    "yearly total, and renewal reminders."
)


class SubscriptionAgent:

    def __init__(self):
        self.messages = [
            SystemMessage(content=SYSTEM_PROMPT)
        ]

    def run(self, user_goal: str, budget: float | None = None):

        budget_context = (
            "No monthly budget is currently set."
            if budget is None
            else f"Current monthly budget from the ledger: {format_inr(budget)}."
        )
        self.messages[0] = SystemMessage(content=f"{SYSTEM_PROMPT}\n\n{budget_context}")

        print(
            f"\n{'=' * 65}\n"
            f"[USER]: {user_goal}\n"
            f"{'=' * 65}"
        )

        # Add user's message
        self.messages.append(
            HumanMessage(content=user_goal)
        )

        while True:

            # Ask the LLM what to do
            msg = llm.invoke(self.messages)

            # Save LLM response
            self.messages.append(msg)

            # If there are no tools to call,
            # the model has produced its final answer
            if not msg.tool_calls:

                content = msg.content

                # Handle different content formats
                if isinstance(content, list):
                    content = "".join(
                        block.get("text", "")
                        if isinstance(block, dict)
                        else str(block)
                        for block in content
                    )

                safe_text = str(content or "").strip()

                print(
                    f"\n[AGENT RESPONSE]:\n"
                    f"{safe_text}\n"
                )

                return safe_text

            # Execute each requested tool
            for tc in msg.tool_calls:

                clean_name = (
                    tc["name"]
                    .split("<|")[0]
                    .split("(")[0]
                    .strip()
                )

                tool_func = TOOL_MAP.get(clean_name)

                if tool_func:

                    result = tool_func.invoke(tc["args"])

                else:

                    result = (
                        f"Error: Tool '{clean_name}' not found."
                    )

                print(
                    f" -> [TOOL CALL] "
                    f"{clean_name}({tc['args']}) => {result}"
                )

                # Send tool result back to the LLM
                self.messages.append(
                    ToolMessage(
                        tool_call_id=tc["id"],
                        content=str(result)
                    )
                )
