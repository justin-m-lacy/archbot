import Char from './char';

const requiredExp = (level: number) => {
	return Math.floor(100 * (Math.pow(1.5, level)));
}

export const getNextExp = (char: Char) => {

	let req = requiredExp(char.level + 1);

	const cls = char.charClass;
	if (cls) req *= cls.expMod;

	const race = char.race;
	if (race) req *= race.expMod;

	return Math.floor(req);

}


export const tryLevel = (char: Char) => {

	if (char.exp < getNextExp(char)) return false;
	char.levelUp();

	return true;

};
