import type { Command, CommandContext, CommandResult } from '../types';

// ASCII art train for when you mistype 'ls' as 'sl'
const train = [
  '      ====        ________                ___________',
  '  _D _|  |_______/        \\__I_I_____===__|_________|',
  '   |(_)---  |   H\\________/ |   |        =|___ ___|  ',
  '   /     |  |   H  |  |     |   |         ||_| |_||  ',
  '  |      |  |   H  |__--------------------| [___] |  ',
  '  | ________|___H__/__|_____/[][]~\\_______|       |  ',
  '  |/ |   |-----------I_____I [][] []  D   |=======|__',
  '__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__',
  ' |/-=|___|=O=====O=====O=====O   |_____/~\\___/       ',
  '  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/          ',
];

const trainSmoke = [
  '                      (  ) (@@) ( )  (@)  ()    @@    O     @',
  '                 (@@@)                                        ',
  '             (    )                                           ',
  '          (@@@@)                                              ',
  '        (   )                                                 ',
];

export const slCommand: Command = {
  name: 'sl',
  aliases: [],
  description: 'Steam Locomotive - you probably meant "ls"',
  usage: 'sl',
  handler: (_ctx: CommandContext): CommandResult => {
    const output: string[] = [
      '',
      '  Choo choo! You meant "ls", not "sl"!',
      '',
      ...trainSmoke,
      ...train,
      '',
      '  ~~~ ALL ABOARD THE TYPO TRAIN ~~~',
      '',
    ];

    return { output };
  },
};
