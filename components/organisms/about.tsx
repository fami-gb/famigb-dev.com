import { Heading, Text } from "@/components/atoms/typography";
import { Container } from "@/components/atoms/container";

export function About() {
    return (
        <section className="py-20 bg-foreground/5">
            <Container>
                <div className="flex flex-col items-center text-center gap-8">
                    <Heading level={3}>なにもの？</Heading>
                    <div className="max-w-2xl">
                        <Text>
                            怪しいものではありません。<br />
                            大学2年生20歳のfami-gbです。 ふぁみじびと読みます。ファミチキが大好きです。
                        </Text>
                        <Text>
                            現在はバックエンドエンジニアとして、インターンに参加したり個人開発を行ったりしています。
                            また、Vimを使い始めて側だけすごそうなエンジニアになってます。
                        </Text>
                        <Text>
                            趣味はプログラミングはもちろん、ゲームやアニメも好きです。<br />
                            好きなゲームは「ゼノブレイドシリーズ」と「Nier Automata」です。おすすめです。
                        </Text>
                    </div>
                </div>
            </Container>
        </section>
    );
}
