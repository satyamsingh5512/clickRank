terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for ClickRank analytics platform"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID where RDS and ElastiCache are deployed"
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnet IDs for database and cache subnet groups"
}

variable "db_username" {
  type        = string
  default     = "clickrank"
  description = "Master username for PostgreSQL"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Master password for PostgreSQL"
}

variable "db_name" {
  type        = string
  default     = "clickrank"
  description = "Initial PostgreSQL database name"
}

variable "allowed_cidr_blocks" {
  type        = list(string)
  default     = []
  description = "CIDR blocks allowed to access database/cache"
}

resource "aws_security_group" "analytics_data_plane" {
  name        = "clickrank-analytics-data-plane"
  description = "Access control for ClickRank RDS and Redis"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
    description = "PostgreSQL access"
  }

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
    description = "Redis access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "clickrank-analytics-data-plane"
    Environment = "prod"
    Project     = "clickrank"
  }
}

resource "aws_db_subnet_group" "clickrank" {
  name       = "clickrank-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "clickrank-db-subnet-group"
    Environment = "prod"
    Project     = "clickrank"
  }
}

resource "aws_db_instance" "clickrank_postgres" {
  identifier             = "clickrank-postgres"
  engine                 = "postgres"
  engine_version         = "15.7"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 50
  max_allocated_storage  = 200
  storage_type           = "gp3"
  storage_encrypted      = true
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.clickrank.name
  vpc_security_group_ids = [aws_security_group.analytics_data_plane.id]
  multi_az               = true
  publicly_accessible    = false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:30-Sun:05:30"
  skip_final_snapshot     = false
  final_snapshot_identifier = "clickrank-postgres-final"
  deletion_protection       = true

  tags = {
    Name        = "clickrank-postgres"
    Environment = "prod"
    Project     = "clickrank"
  }
}

resource "aws_elasticache_subnet_group" "clickrank" {
  name       = "clickrank-redis-subnet-group"
  subnet_ids = var.private_subnet_ids
}

resource "aws_elasticache_replication_group" "clickrank_redis" {
  replication_group_id       = "clickrank-redis"
  description                = "ClickRank analytics cache"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = "cache.t4g.micro"
  port                       = 6379
  automatic_failover_enabled = true
  multi_az_enabled           = true
  num_node_groups            = 1
  replicas_per_node_group    = 1
  subnet_group_name          = aws_elasticache_subnet_group.clickrank.name
  security_group_ids         = [aws_security_group.analytics_data_plane.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Name        = "clickrank-redis"
    Environment = "prod"
    Project     = "clickrank"
  }
}

output "postgres_endpoint" {
  description = "RDS endpoint for ClickRank PostgreSQL"
  value       = aws_db_instance.clickrank_postgres.address
}

output "redis_primary_endpoint" {
  description = "Primary endpoint for ElastiCache Redis"
  value       = aws_elasticache_replication_group.clickrank_redis.primary_endpoint_address
}
