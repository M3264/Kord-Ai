const emojis = {
    challenge: '👨‍💻',
    correct: '✅',
    incorrect: '❌',
    hint: '💡',
    quiz: '📚',
};

const challenges = {
    javascript: {
        easy: [
            {
                question: "Write a function to calculate the sum of two numbers.",
                testCases: [[1, 2, 3], [5, -3, 2]],
                solution: "function sum(a, b) { return a + b; }"
            },
            {
                question: "Write a function to reverse a string.",
                testCases: [["hello", "olleh"], ["world", "dlrow"]],
                solution: "function reverseString(str) { return str.split('').reverse().join(''); }"
            },
            // ... more easy JavaScript challenges
        ],
        medium: [
            {
                question: "Write a function to check if a string is a palindrome.",
                testCases: [["racecar", true], ["hello", false]],
                solution: "function isPalindrome(str) { return str === str.split('').reverse().join(''); }"
            },
            // ... more medium JavaScript challenges
        ],
        hard: [
            {
                question: "Write a function to merge two sorted arrays into a single sorted array.",
                testCases: [[[1, 3, 5], [2, 4, 6], [1, 2, 3, 4, 5, 6]], [[-1, 2], [-3, 4], [-3, -1, 2, 4]]],
                solution: "function mergeSortedArrays(arr1, arr2) { return [...arr1, ...arr2].sort((a, b) => a - b); }"
            },
            // ... more hard JavaScript challenges
        ]
    },
    // ... other languages and levels
};

const quizzes = {
    general: {
        easy: [
            {
                question: "What is the capital of France?",
                options: ["Berlin", "Madrid", "Paris", "Lisbon"],
                answer: "Paris"
            },
            {
                question: "What is 2 + 2?",
                options: ["3", "4", "5", "6"],
                answer: "4"
            },
            // ... more easy quizzes
        ],
        medium: [
            {
                question: "What is the largest planet in our solar system?",
                options: ["Earth", "Mars", "Jupiter", "Saturn"],
                answer: "Jupiter"
            },
            // ... more medium quizzes
        ],
        hard: [
            {
                question: "What year did the Titanic sink?",
                options: ["1912", "1922", "1932", "1942"],
                answer: "1912"
            },
            // ... more hard quizzes
        ]
    },
    // ... other categories
};

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

module.exports = {
    usage: ["codechallenge", "quiz"],
    desc: "Test your coding skills with a fun challenge or take a quiz.",
    commandType: "Fun",
    isGroupOnly: false,
    isAdminOnly: false,
    isPrivateOnly: false,
    emoji: emojis.challenge,

    async execute(sock, m, args) {
        try {
            const type = args[0]?.toLowerCase();
            const level = args[1]?.toLowerCase() || "easy";
            const category = args[2]?.toLowerCase() || "general";

            if (type === "codechallenge") {
                const language = args[2]?.toLowerCase() || "javascript";

                if (!challenges[language] || !challenges[language][level]) {
                    return await kord.reply(m, "Invalid level or language. Please choose from: easy, medium, hard and javascript, python, java, etc. Example `/codechallenge easy javascript`");
                }

                const challenge = getRandomItem(challenges[language][level]);
                await kord.reply(m, `${emojis.challenge} **Coding Challenge:**\n\n${challenge.question}\n\nType your solution in a new message. (Use /giveup if you're stuck)`);

                const sentMsg = await kord.reply(m, `${emojis.challenge} **Coding Challenge:**\n\n${challenge.question}\n\nType your solution in a new message. (Use /giveup if you're stuck)`);
                const response = await kord.getResponseText(m, sentMsg, 15000); // 60 seconds timeout

                if (!response) {
                    return await kord.reply(m, "Time's up! ⏰ The correct answer was:\n\n`" + challenge.solution + "`");
                }
                if (response.response.startsWith("/giveup")) {
                    return await kord.reply(m, `${emojis.hint} The solution was:\n\n\`\`\`${challenge.solution}\`\`\``);
                }

                const userAnswer = response.response
                const isCorrect = challenge.testCases.every(([input, expectedOutput]) => {
                    // Evaluate the user's answer within a controlled scope
                    const result = (new Function(...Object.keys(input), userAnswer))(...Object.values(input));
                    return result === expectedOutput;
                });

                if (isCorrect) {
                    await kord.reply(m, `${emojis.correct} Correct! Great job!`);
                } else {
                    await kord.reply(m, `${emojis.incorrect} Incorrect. Try again or use \`/giveup\` for the solution.`);
                }

            } else if (type === "quiz") {
                if (!quizzes[category] || !quizzes[category][level]) {
                    return await kord.reply(m, "Invalid level or category. Please choose from: easy, medium, hard and general, science, history, etc. Example `/quiz easy general`");
                }

                const quiz = getRandomItem(quizzes[category][level]);
                const optionsText = quiz.options.map((option, index) => `${index + 1}. ${option}`).join('\n');
                await kord.reply(m, `${emojis.quiz} **Quiz:**\n\n${quiz.question}\n\n${optionsText}\n\nReply with the number of the correct answer.`);

                const sentMsg = await kord.reply(m, `${emojis.quiz} **Quiz:**\n\n${quiz.question}\n\n${optionsText}\n\nReply with the number of the correct answer.`);
                const response = await kord.getResponseText(m, sentMsg, 30000); // 30 seconds timeout

                if (!response) {
                    return await kord.reply(m, "Time's up! ⏰ The correct answer was: " + quiz.answer);
                }

                const userAnswer = quiz.options[parseInt(response.response) - 1];
                if (userAnswer === quiz.answer) {
                    await kord.reply(m, `${emojis.correct} Correct! Great job!`);
                } else {
                    await kord.reply(m, `${emojis.incorrect} Incorrect. The correct answer was: ${quiz.answer}`);
                }

            } else {
                await kord.reply(m, "Please specify a valid command type: `codechallenge` or `quiz`. Example `/codechallenge easy javascript` or `/quiz easy general`.");
            }
        } catch (error) {
            await kord.reply(m, "❌ An error occurred while processing the command.");
            console.error("Error in execute command:", error);
        }
    }
};
