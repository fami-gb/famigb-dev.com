import { Avatar } from "@/components/atoms/avatar";
import { Heading, Text } from "@/components/atoms/typography";
import { SocialLinks } from "@/components/molecules/social-links";

export function Hero() {
    return (
        <section className="p-20 flex flex-col md:flex-row items-center gap-8 justify-center min-h-[50vh]">
            <Avatar
                src="/takopi-github.jpg"
                alt="profile image"
                width={100}
                height={100}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full"
            />
            <div className="text-center md:text-left">
                <Heading level={1} className="mb-2">fami-gb</Heading>
                <Text className="text-lg mb-4">
                    Backend Engineer / Vimmer / Univ. Student
                </Text>
                <SocialLinks className="justify-center md:justify-start" />
            </div>
        </section>
    );
}
