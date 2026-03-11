<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'placement_id' => ['required', 'exists:placements,id'],
            'document_type' => ['required', 'string', 'max:100'],
            'document_file' => ['required', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png'],
        ];
    }
}
