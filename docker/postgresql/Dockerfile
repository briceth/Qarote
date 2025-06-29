FROM postgres:15

# Install pg_partman
RUN apt-get update && \
    apt-get install -y postgresql-15-partman && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy initialization script to enable pg_partman
COPY init-partman.sql /docker-entrypoint-initdb.d/

# The rest is handled by the base postgres image
