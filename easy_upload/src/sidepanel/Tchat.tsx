import Chat, { Bubble, Message, MessageProps } from '@chatui/core';
import '@chatui/core/dist/index.css';
import { ReactNode, useEffect } from 'react';
import { ConversationNotifier } from './ConversationNotifier';
import { MessagesNotifier } from './message/MessageNotifier';

export default function Tchat() {
    const messages = MessagesNotifier(state => state.messages);
    const prompt = ConversationNotifier(state => state.prompt);

    useEffect(() => {
        ConversationNotifier.getState().init().then(() => {
            console.log("conv initialisée");
        })
    }, []);

    async function handleSend(type: string, val: string) {
        if (type === 'text' && val.trim()) {
            prompt(val);
        }
    }

    function renderMessageContent(msg: MessageProps): ReactNode {
        const { content } = msg;
        return <Bubble content={content} />;
    }

    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <Chat
                locale="en-EN"
                navbar={{ title: 'Assistant' }}
                messages={messages}
                renderMessageContent={renderMessageContent}
                onSend={handleSend}
            />
        </div>
    );
}