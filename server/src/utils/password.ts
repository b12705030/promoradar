import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export function hashPassword(plain: string) {
	const salt = bcrypt.genSaltSync(SALT_ROUNDS);
	return bcrypt.hashSync(plain, salt);
}

export function verifyPassword(plain: string, hash: string) {
	return bcrypt.compareSync(plain, hash);
}

