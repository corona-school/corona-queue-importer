"use strict";
import dotenv from "dotenv";
import { Sequelize, Model, Table, Column } from "sequelize-typescript";
import queue from "./queue2.json";
dotenv.config();

export type Status = "waiting" | "active" | "completed" | "rejected";

export interface ScreenerInfo {
	firstname: string;
	lastname: string;
	email: string;
	time: number;
}

export interface Subject {
	subject: string;
	min: number;
	max: number;
}

export interface Job {
	firstname: string;
	lastname: string;
	email: string;
	subjects: Subject[];
	phone?: string;
	birthday?: string;
	msg?: string;
	screener: ScreenerInfo;
	invited?: boolean;
	feedback?: string;
	knowcsfrom: string;
	commentScreener?: string;
	time: number;
	jitsi: string;
	status: Status;
	position?: number;
}

@Table({
	timestamps: false,
	tableName: "queue_log",
})
class QueueLog extends Model<QueueLog> {
	@Column({ autoIncrement: true, primaryKey: true }) id: number;
	@Column({ field: "created_at" }) createdAt: string;
	@Column({ field: "finnished_at" }) finnishedAt: string;
	@Column completed: boolean;
	@Column({ field: "screener_email" }) screenerEmail: string;
	@Column({ field: "student_email" }) studentEmail: string;
}

const uri = process.env.DATABASE_URL;

export const sequelize = new Sequelize(uri, {
	logging: false,
	dialect: "postgres",
	ssl: true,
	native: true,
	models: [QueueLog],
});

const bulkSave = async () => {
	for (let i = 0; i <= queue.length; i++) {
		const job = queue[i] as Job;

		if (!job) {
			continue;
		}

		if (job.status !== "completed" && job.status !== "rejected") {
			continue;
		}

		try {
			const log = await QueueLog.findOne({
				where: {
					screenerEmail: job.screener.email,
					studentEmail: job.email,
				},
			});
			if (log) {
				console.log("Duplicate");
				continue;
			}
			const queue = new QueueLog({
				createdAt: new Date(job.time).toISOString(),
				finnishedAt: new Date(job.screener.time).toISOString(),
				completed: job.status === "completed",
				screenerEmail: job.screener.email,
				studentEmail: job.email,
			});
			await queue.save();
			console.log("success");
		} catch (e) {
			console.log(e.name, e.original.messageDetail);
		}
	}
};

bulkSave();
