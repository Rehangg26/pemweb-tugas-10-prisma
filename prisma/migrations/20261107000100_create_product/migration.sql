CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Product_name_not_blank" CHECK (length(trim("name")) > 0),
    CONSTRAINT "Product_price_nonnegative" CHECK ("price" >= 0)
);

