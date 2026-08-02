from typing import List, Dict

class MemoryService:
    def __init__(self):
        self._memory_store: Dict[str, List[Dict[str, str]]] = {}

    def add_user_message(self, conversation_id: str, content: str):
        if conversation_id not in self._memory_store:
            self._memory_store[conversation_id] = []
        self._memory_store[conversation_id].append({"role": "user", "content": content})

    def add_assistant_message(self, conversation_id: str, content: str):
        if conversation_id not in self._memory_store:
            self._memory_store[conversation_id] = []
        self._memory_store[conversation_id].append({"role": "assistant", "content": content})

    def get_formatted_history(self, conversation_id: str, max_turns: int = 5) -> str:
        history = self._memory_store.get(conversation_id, [])
        recent = history[-max_turns * 2:]
        formatted = []
        for msg in recent:
            role_name = "User" if msg["role"] == "user" else "Assistant"
            formatted.append(f"{role_name}: {msg['content']}")
        return "\n".join(formatted)

memory_service = MemoryService()
