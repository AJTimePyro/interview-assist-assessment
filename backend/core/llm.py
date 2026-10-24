from langchain_ollama import ChatOllama

from core.config import settings


def build_chat_model(temperature: float, num_predict: int) -> ChatOllama:
    return ChatOllama(
        model=settings.OLLAMA_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
        reasoning=False,
        keep_alive=settings.OLLAMA_KEEP_ALIVE,
        num_ctx=settings.OLLAMA_NUM_CTX,
        temperature=temperature,
        num_predict=num_predict,
    )


classifier_llm = build_chat_model(temperature=0, num_predict=60)
answer_llm = build_chat_model(temperature=0.3, num_predict=220)
