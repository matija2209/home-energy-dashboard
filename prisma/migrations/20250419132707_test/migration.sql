-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeteringPoint" (
    "gsrn" TEXT NOT NULL,
    "name" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeteringPoint_pkey" PRIMARY KEY ("gsrn")
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "readingTypeCode" TEXT NOT NULL,
    "quality" JSONB,
    "meteringPointId" TEXT NOT NULL,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MeteringPoint_gsrn_key" ON "MeteringPoint"("gsrn");

-- CreateIndex
CREATE INDEX "MeterReading_timestamp_idx" ON "MeterReading"("timestamp");

-- CreateIndex
CREATE INDEX "MeterReading_meteringPointId_readingTypeCode_timestamp_idx" ON "MeterReading"("meteringPointId", "readingTypeCode", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MeterReading_meteringPointId_readingTypeCode_timestamp_key" ON "MeterReading"("meteringPointId", "readingTypeCode", "timestamp");

-- AddForeignKey
ALTER TABLE "MeteringPoint" ADD CONSTRAINT "MeteringPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_meteringPointId_fkey" FOREIGN KEY ("meteringPointId") REFERENCES "MeteringPoint"("gsrn") ON DELETE CASCADE ON UPDATE CASCADE;
