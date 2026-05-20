// OpenAI互換のChat Completions APIを呼び出す最小限の実装
async function callOpenAI() {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: 'TypeScriptについて簡潔に説明してください。' }
        ],
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error('API error:', data.error);
      return;
    }
    console.log(data.choices[0].message.content);
  }

  // 関数を実行
  callOpenAI();