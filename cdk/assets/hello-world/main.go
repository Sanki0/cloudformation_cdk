package main

import (
	"context"
	"fmt"
	"os"
	"strconv"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

type ChunkSize struct {
	Max                  int    `json:"max"`
	Min                  int    `json:"min"`
	Size                 int    `json:"size"`
	SizeMigracion        int    `json:"sizeMigracion"`
	SizePath             int    `json:"sizePath"`
	SizePathPath         int    `json:"sizePathPath"`
	SizeXMLBatch         int    `json:"sizeXMLBatch"`
	LoopTimeBilling      int    `json:"loopTimeBilling"`
	LoopTimeMigration    int    `json:"loopTimeMigration"`
	Period               string `json:"period"`
	WaitTimeBilling      int    `json:"waitTimeBilling"`
	WaitTimeMigration    int    `json:"waitTimeMigration"`
	MaxConcurrencyInsert int    `json:"maxConcurrencyInsert"`
}

type Event struct {
	DataSize   int    `json:"dataSize"`
	IdProcesso string `json:"idProcess"`
}

func findSmallestChunkSize(dataSize int, chunks []ChunkSize) *ChunkSize {
	var smallestValid *ChunkSize = nil
	for i := 0; i < len(chunks); i++ {
		chunk := &chunks[i]
		if dataSize >= chunk.Min && dataSize <= chunk.Max {
			if smallestValid == nil || chunk.Size < smallestValid.Size {
				smallestValid = chunk
			}
		}
	}
	return smallestValid
}

func handler(context context.Context, event Event) (string, error) {
	TableName := os.Getenv("dbProcess")
	region := os.Getenv("region")

	sess, _ := session.NewSession(&aws.Config{
		Region: aws.String(region)},
	)

	svcDynamo := dynamodb.New(sess) // Dynamodb

	//filter by dataSize between min and max

	query := dynamodb.QueryInput{
		TableName:              aws.String(TableName),
		KeyConditionExpression: aws.String("pk=:pk AND begins_with(sk, :sk)"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":pk": {S: aws.String("CHUNKSIZE")},
			":sk": {S: aws.String("SIZE#")},
		},
	}

	result, err := svcDynamo.Query(&query)

	if err != nil {
		return "", err
	}

	var chunkSizeArr []ChunkSize

	for _, i := range result.Items {
		max, _ := strconv.Atoi(*i["max"].N)
		min, _ := strconv.Atoi(*i["min"].N)
		size, _ := strconv.Atoi(*i["size"].N)
		sizeMigracion, _ := strconv.Atoi(*i["sizeMigracion"].N)
		sizePath, _ := strconv.Atoi(*i["sizePath"].N)
		sizePathPath, _ := strconv.Atoi(*i["sizePathPath"].N)
		sizeXMLBatch, _ := strconv.Atoi(*i["sizeXMLBatch"].N)
		loopTimeBilling, _ := strconv.Atoi(*i["loopTimeBilling"].N)
		loopTimeMigration, _ := strconv.Atoi(*i["loopTimeMigration"].N)
		waitTimeBilling, _ := strconv.Atoi(*i["waitTimeBilling"].N)
		waitTimeMigration, _ := strconv.Atoi(*i["waitTimeMigration"].N)
		period := *i["period"].S
		maxConcurrencyInsert, _ := strconv.Atoi(*i["maxConcurrencyInsert"].N)
		chunkSize := ChunkSize{
			Max:                  max,
			Min:                  min,
			Size:                 size,
			SizeMigracion:        sizeMigracion,
			SizePath:             sizePath,
			SizePathPath:         sizePathPath,
			SizeXMLBatch:         sizeXMLBatch,
			LoopTimeBilling:      loopTimeBilling,
			LoopTimeMigration:    loopTimeMigration,
			Period:               period,
			WaitTimeBilling:      waitTimeBilling,
			WaitTimeMigration:    waitTimeMigration,
			MaxConcurrencyInsert: maxConcurrencyInsert,
		}
		chunkSizeArr = append(chunkSizeArr, chunkSize)
	}

	chunkSizePicked := findSmallestChunkSize(event.DataSize, chunkSizeArr)

	if chunkSizePicked == nil {
		return "", fmt.Errorf("no chunk size found for data size %d", event.DataSize)
	}

	putInput := dynamodb.PutItemInput{
		TableName: aws.String(TableName),
		Item: map[string]*dynamodb.AttributeValue{
			"pk":                   {S: aws.String(event.IdProcesso)},
			"sk":                   {S: aws.String("CHUNKSIZE")},
			"size":                 {N: aws.String(fmt.Sprintf("%d", chunkSizePicked.Size))},
			"sizeMigracion":        {N: aws.String(fmt.Sprintf("%d", chunkSizePicked.SizeMigracion))},
			"sizePath":             {N: aws.String(fmt.Sprintf("%d", chunkSizePicked.SizePath))},
			"sizePathPath":         {N: aws.String(fmt.Sprintf("%d", chunkSizePicked.SizePathPath))},
			"sizeXMLBatch":         {N: aws.String(fmt.Sprintf("%d", chunkSizePicked.SizeXMLBatch))},
			"loopTimeBilling":      {N: aws.String(fmt.Sprintf("%d", chunkSizePicked.LoopTimeBilling))},
			"loopTimeMigration":    {N: aws.String(fmt.Sprintf("%d", chunkSizePicked.LoopTimeMigration))},
			"period":               {S: aws.String(chunkSizePicked.Period)},
			"waitTimeBilling":      {N: aws.String(fmt.Sprintf("%d", chunkSizePicked.WaitTimeBilling))},
			"waitTimeMigration":    {N: aws.String(fmt.Sprintf("%d", chunkSizePicked.WaitTimeMigration))},
			"maxConcurrencyInsert": {N: aws.String(fmt.Sprintf("%d", chunkSizePicked.MaxConcurrencyInsert))},
		},
	}

	_, err = svcDynamo.PutItem(&putInput)

	if err != nil {
		return "", err
	}

	return "Success", nil

}

func main() {
	lambda.Start(handler)
}
