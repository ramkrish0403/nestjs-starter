import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  knowledgeBaseIds: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  topK?: number = 5;
}
