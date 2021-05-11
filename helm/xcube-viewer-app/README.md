### Other configuration

These keys are expected to be setup correctly:

    configMapKeyRef:
      name: s3fs-fuse
      key: S3_BUCKET

    secretKeyRef:
      name: s3fs-fuse
      key: AWS_S3_ACCESS_KEY_ID

    secretKeyRef:
      name: s3fs-fuse
      key: AWS_S3_SECRET_ACCESS_KEY
